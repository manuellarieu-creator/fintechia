const db = require('../config/db');

/**
 * Moteur de fraude centralisé
 */
class FraudEngine {
    
    /**
     * Vérifie une transaction (virement) par rapport aux règles actives.
     * @param {Object} data - { user_id, amount, destination_iban, account_max_transfer_amount, ia_score }
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
                if (condition_field === 'ia_score') testValue = parseFloat(data.ia_score || 0);
                
                if (testValue === null || testValue === undefined) continue;

                // Priority for account specific rule
                if (condition_field === 'montant' && data.account_max_transfer_amount) {
                    if (testValue <= parseFloat(data.account_max_transfer_amount)) {
                        continue; // Skip global rule if account specific rule is satisfied
                    }
                }

                // Evaluer l'opérateur
                switch (condition_operator) {
                    case '>': isMatched = testValue > parseFloat(condition_value); break;
                    case '<': isMatched = testValue < parseFloat(condition_value); break;
                    case '>=': isMatched = testValue >= parseFloat(condition_value); break;
                    case '<=': isMatched = testValue <= parseFloat(condition_value); break;
                    case '==': isMatched = testValue == condition_value; break;
                    case '!=': isMatched = testValue != condition_value; break;
                    case 'NOT_LIKE':
                        if(typeof testValue === 'string') isMatched = !testValue.startsWith(condition_value.replace('%',''));
                        break;
                    case 'LIKE':
                        if(typeof testValue === 'string') isMatched = testValue.startsWith(condition_value.replace('%',''));
                        break;
                    case 'NOT_IN_EU':
                        if(typeof testValue === 'string') {
                            const euCountries = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
                            isMatched = !euCountries.includes(testValue.substring(0, 2).toUpperCase());
                        }
                        break;
                }

                if (isMatched) {
                    matchedRules.push(rule);
                    
                    if (action_type === 'block') finalAction = 'block';
                    else if (action_type === 'alert_manual' && finalAction !== 'block') finalAction = 'alert_manual';
                    else if (action_type === 'alert_only' && finalAction === 'allow') finalAction = 'alert_only';
                    
                    await db.query(`UPDATE fraud_detection_rules SET times_triggered = times_triggered + 1 WHERE id = ?`, [id]);
                    
                    let severity = 'low';
                    if (action_type === 'block') severity = 'high';
                    if (action_type === 'alert_manual') severity = 'medium';
                    
                    await db.query(
                        `INSERT INTO alertes_fraudes (user_id, type, niveau_risque, description, statut) VALUES (?, ?, ?, ?, 'en_attente')`,
                        [data.user_id, 'virement_suspect', severity, `Règle de sécurité: ${rule.rule_name}`]
                    );
                }
            }
            return { action: finalAction, matchedRules };
        } catch (err) {
            console.error("Erreur dans FraudEngine:", err);
            return { action: 'allow', matchedRules: [] };
        }
    }

    /**
     * Vérifie un événement de login ou OTP
     * @param {Object} data - { user_id, ip_risk, otp_fails }
     */
    static async checkLogin(data) {
        try {
            const [rules] = await db.query(`SELECT * FROM fraud_detection_rules WHERE is_active = TRUE AND event_type = 'login'`);
            let finalAction = 'allow';
            
            for (const rule of rules) {
                const { id, condition_field, condition_operator, condition_value, action_type } = rule;
                let isMatched = false;
                let testValue = null;
                
                if (condition_field === 'ip_risk') testValue = parseFloat(data.ip_risk || 0);
                if (condition_field === 'otp_fails') testValue = parseInt(data.otp_fails || 0, 10);
                if (testValue === null || testValue === undefined) continue;

                switch (condition_operator) {
                    case '>': isMatched = testValue > parseFloat(condition_value); break;
                    case '>=': isMatched = testValue >= parseFloat(condition_value); break;
                }

                if (isMatched) {
                    if (action_type === 'block') finalAction = 'block';
                    else if (action_type === 'alert_only' && finalAction === 'allow') finalAction = 'alert_only';
                    
                    await db.query(`UPDATE fraud_detection_rules SET times_triggered = times_triggered + 1 WHERE id = ?`, [id]);
                    let severity = action_type === 'block' ? 'high' : 'medium';
                    await db.query(
                        `INSERT INTO alertes_fraudes (user_id, type, niveau_risque, description, statut) VALUES (?, ?, ?, ?, 'en_attente')`,
                        [data.user_id, 'connexion_suspecte', severity, `Règle de sécurité: ${rule.rule_name}`]
                    );
                }
            }
            return { action: finalAction };
        } catch (err) {
            return { action: 'allow' };
        }
    }

    /**
     * Vérifie un événement KYC
     * @param {Object} data - { user_id, kyc_score }
     */
    static async checkKyc(data) {
        try {
            const [rules] = await db.query(`SELECT * FROM fraud_detection_rules WHERE is_active = TRUE AND event_type = 'kyc'`);
            let finalAction = 'allow';
            
            for (const rule of rules) {
                const { id, condition_field, condition_operator, condition_value, action_type } = rule;
                let isMatched = false;
                let testValue = null;
                
                if (condition_field === 'kyc_score') testValue = parseFloat(data.kyc_score || 100);
                if (testValue === null || testValue === undefined) continue;

                switch (condition_operator) {
                    case '<': isMatched = testValue < parseFloat(condition_value); break;
                    case '<=': isMatched = testValue <= parseFloat(condition_value); break;
                }

                if (isMatched) {
                    if (action_type === 'block') finalAction = 'block';
                    await db.query(`UPDATE fraud_detection_rules SET times_triggered = times_triggered + 1 WHERE id = ?`, [id]);
                    await db.query(
                        `INSERT INTO alertes_fraudes (user_id, type, niveau_risque, description, statut) VALUES (?, ?, ?, ?, 'en_attente')`,
                        [data.user_id, 'kyc_suspect', 'high', `Règle de sécurité: ${rule.rule_name}`]
                    );
                }
            }
            return { action: finalAction };
        } catch (err) {
            return { action: 'allow' };
        }
    }
}

module.exports = FraudEngine;
