require('dotenv').config({ path: __dirname + '/.env' });
const db = require('./backend/config/db');

async function seed() {
    try {
        const rules = [
            { name: 'Montant élevé', event: 'virement', field: 'montant', op: '>', val: '1000', action: 'block' },
            { name: 'Montant très élevé', event: 'virement', field: 'montant', op: '>', val: '5000', action: 'block' },
            { name: 'Zone géographique à risque', event: 'virement', field: 'destination_iban', op: 'NOT_IN_EU', val: 'EU', action: 'alert_manual' },
            { name: 'Masquage IP détecté', event: 'login', field: 'ip_risk', op: '>', val: '80', action: 'alert_only' },
            { name: 'Analyse comportementale', event: 'virement', field: 'ia_score', op: '>', val: '70', action: 'alert_only' }, // alert_critique doesn't exist, we use alert_only with high severity maybe, wait, 'alert_manual' is medium, 'block' is high. Let's use 'alert_only' and engine can flag high.
            { name: 'Tentative de force brute', event: 'login', field: 'otp_fails', op: '>=', val: '3', action: 'block' },
            { name: 'Score Selfie', event: 'kyc', field: 'kyc_score', op: '<', val: '50', action: 'block' }
        ];

        for (const rule of rules) {
            const [exists] = await db.query('SELECT id FROM fraud_detection_rules WHERE rule_name = ?', [rule.name]);
            if (exists.length === 0) {
                await db.query(`
                    INSERT INTO fraud_detection_rules 
                    (rule_name, event_type, condition_field, condition_operator, condition_value, action_type, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, 0)
                `, [rule.name, rule.event, rule.field, rule.op, rule.val, rule.action]);
                console.log(`Inserted rule: ${rule.name}`);
            } else {
                console.log(`Rule already exists: ${rule.name}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

seed();
