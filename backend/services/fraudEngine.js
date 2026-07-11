const db = require('../config/db');

/**
 * Moteur de fraude centralisé
 */
class FraudEngine {
    
    /**
     * Vérifie une transaction (virement) par rapport aux règles actives.
     * @param {Object} data - { user_id, amount, destination_iban, ip }
     * @returns {Object} - { action: 'allow' | 'block' | 'alert_manual' | 'alert_only', matched_rules: [] }
     */
    static async checkTransaction(data) {
        try {
            const [rules] = await db.query(`SELECT * FROM fraud_detection_rules WHERE is_active = TRUE AND event_type = 'virement'`);
            
            let finalAction = 'allow';
            const matchedRules = [];
            
            for (const rule of rules) {
                const { id, condition_field, condition_operator, condition_value, action_type } = rule;
                let isMatched = false;
                
                // Extraire la valeur à tester
                let testValue = null;
                if (condition_field === 'montant') testValue = parseFloat(data.amount);
                if (condition_field === 'destination_iban') testValue = data.destination_iban;
                // Add other fields as needed
                
                if (testValue === null || testValue === undefined) continue;

                // Evaluer l'opérateur
                switch (condition_operator) {
                    case '>':
                        isMatched = testValue > parseFloat(condition_value);
                        break;
                    case '<':
                        isMatched = testValue < parseFloat(condition_value);
                        break;
                    case '>=':
                        isMatched = testValue >= parseFloat(condition_value);
                        break;
                    case '<=':
                        isMatched = testValue <= parseFloat(condition_value);
                        break;
                    case '==':
                        isMatched = testValue == condition_value;
                        break;
                    case '!=':
                        isMatched = testValue != condition_value;
                        break;
                    case 'NOT_LIKE':
                        // e.g. NOT_LIKE FR%
                        if(typeof testValue === 'string') {
                            isMatched = !testValue.startsWith(condition_value.replace('%',''));
                        }
                        break;
                    case 'LIKE':
                        if(typeof testValue === 'string') {
                            isMatched = testValue.startsWith(condition_value.replace('%',''));
                        }
                        break;
                }

                if (isMatched) {
                    matchedRules.push(rule);
                    
                    // Escalate finalAction if needed
                    if (action_type === 'block') {
                        finalAction = 'block';
                    } else if (action_type === 'alert_manual' && finalAction !== 'block') {
                        finalAction = 'alert_manual';
                    } else if (action_type === 'alert_only' && finalAction === 'allow') {
                        finalAction = 'alert_only';
                    }
                    
                    // Incrémenter le compteur de la règle
                    await db.query(`UPDATE fraud_detection_rules SET times_triggered = times_triggered + 1 WHERE id = ?`, [id]);
                    
                    // Créer l'alerte
                    let severity = 'low';
                    if (action_type === 'block') severity = 'high';
                    if (action_type === 'alert_manual') severity = 'medium';
                    
                    await db.query(
                        `INSERT INTO alertes_fraudes (user_id, type, niveau_risque, description, statut) VALUES (?, ?, ?, ?, 'en_attente')`,
                        [data.user_id, 'virement_suspect', severity, `Déclenchement règle: ${rule.rule_name}`]
                    );
                }
            }
            
            return { action: finalAction, matchedRules };
        } catch (err) {
            console.error("Erreur dans FraudEngine:", err);
            // Par défaut on laisse passer si le moteur plante, pour ne pas bloquer le service
            return { action: 'allow', matchedRules: [] };
        }
    }
}

module.exports = FraudEngine;
