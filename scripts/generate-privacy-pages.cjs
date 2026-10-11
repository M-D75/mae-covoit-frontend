const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

async function main() {
    // Match Vue CLI's production env priority; use only the public support address.
    for (const filename of ['.env.production.local', '.env.production', '.env.local', '.env']) {
        const fullPath = path.join(__dirname, '..', filename);
        if (fs.existsSync(fullPath)) dotenv.config({ path: fullPath });
    }
    const source = fs.readFileSync(path.join(__dirname, '../src/services/privacyPolicy.js'), 'utf8');
    const { privacySections, privacyContactEmail } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    if (privacyContactEmail && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(privacyContactEmail)) {
        throw new Error('VUE_APP_PRIVACY_CONTACT_EMAIL is not a valid email address');
    }
    const contact = privacyContactEmail
        ? `<p>Contact : <a href="mailto:${escape(privacyContactEmail)}">${escape(privacyContactEmail)}</a></p>`
        : '';
    const layout = (title, body) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} — Covia</title>
<style>body{font:16px/1.65 system-ui,sans-serif;color:#16363d;background:#f3f9f8;margin:0}main{max-width:760px;margin:32px auto;padding:24px;background:white;border-radius:16px}a{color:#006b72}h1{line-height:1.2}h2{font-size:1.2rem;margin-top:28px}.notice{padding:16px;background:#fff3d6;border-radius:8px}@media(max-width:800px){main{margin:16px}}</style></head>
<body><main><p>Covia · MAE Solutions · Covoiturage à Mayotte</p><h1>${escape(title)}</h1>${body}${contact}<nav><a href="privacy.html">Confidentialité</a> · <a href="account-deletion.html">Suppression de compte</a></nav></main></body></html>`;
    const policyBody = privacySections.map(section => `<section><h2>${escape(section.title)}</h2><p>${escape(section.text)}</p></section>`).join('\n');
    const requestLink = privacyContactEmail
        ? `<p><a href="mailto:${escape(privacyContactEmail)}?subject=${encodeURIComponent('Covia — demande de suppression de compte')}&amp;body=${encodeURIComponent('Bonjour,\nJe demande la suppression de mon compte Covia et des données associées.\nAdresse e-mail du compte : \nMerci de me confirmer le traitement de cette demande.')}">Envoyer une demande de suppression</a></p>`
        : '';
    const deletionBody = `<p>Vous pouvez demander la suppression de votre compte Covia et des données associées sans réinstaller l’application.</p>
<h2>Depuis l’application</h2><p>Ouvrez Réglages, puis Protection des données et sélectionnez « Supprimer mon compte ».</p>
<h2>Sans l’application ou en cas de refus automatique</h2><p>Contactez MAE Solutions à l’adresse ci-dessous en précisant l’adresse e-mail de votre compte et votre demande de suppression. Une vérification de votre identité pourra être nécessaire. Ne transmettez jamais votre mot de passe ni vos informations de carte bancaire.</p>${requestLink}
<h2>Données concernées</h2><p>La demande porte sur votre compte, votre profil et les données personnelles associées. Si le compte a un historique financier, une procédure manuelle de suppression ou d’anonymisation est nécessaire pour traiter séparément les données devant être conservées au titre des obligations comptables, des litiges ou de la sécurité.</p>
<p>Vous pouvez contacter MAE Solutions pour connaître les durées de conservation applicables à votre situation et le suivi de votre demande.</p>`;
    fs.writeFileSync(path.join(__dirname, '../public/privacy.html'), layout('Politique de confidentialité', policyBody));
    fs.writeFileSync(path.join(__dirname, '../public/account-deletion.html'), layout('Suppression de compte et de données', deletionBody));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
