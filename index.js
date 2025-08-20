const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Token de vérification WhatsApp
const VERIFY_TOKEN = 'test123';

console.log('🚀 Serveur webhook WhatsApp NoDaysOff démarré');
console.log(`🔑 Token de vérification: ${VERIFY_TOKEN}`);

// Endpoint de vérification WhatsApp (GET)
app.get('/webhook', (req, res) => {
    console.log('\n🔍 === VÉRIFICATION WEBHOOK WHATSAPP ===');
    console.log('Query params:', req.query);
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log(`Mode: ${mode}`);
    console.log(`Token reçu: ${token}`);
    console.log(`Challenge: ${challenge}`);
    
    // Vérification des paramètres
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ VÉRIFICATION RÉUSSIE !');
        console.log(`📤 Renvoi du challenge: ${challenge}`);
        res.status(200).send(challenge);
    } else {
        console.log('❌ ÉCHEC DE LA VÉRIFICATION');
        console.log(`❌ Mode attendu: subscribe, reçu: ${mode}`);
        console.log(`❌ Token attendu: ${VERIFY_TOKEN}, reçu: ${token}`);
        res.sendStatus(403);
    }
});

// Endpoint pour recevoir les messages WhatsApp (POST)
app.post('/webhook', (req, res) => {
    console.log('\n📨 === NOUVEAU MESSAGE WHATSAPP ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const body = req.body;
    
    // Vérifier que c'est bien un message WhatsApp Business
    if (body.object === 'whatsapp_business_account') {
        console.log('✅ Message WhatsApp Business détecté');
        
        if (body.entry && body.entry[0] && body.entry[0].changes) {
            const changes = body.entry[0].changes;
            
            changes.forEach((change, index) => {
                console.log(`\n📝 === CHANGEMENT ${index + 1} ===`);
                console.log('Type de changement:', change.field);
                
                if (change.value && change.value.messages) {
                    const messages = change.value.messages;
                    
                    messages.forEach((message, msgIndex) => {
                        console.log(`\n💬 === MESSAGE ${msgIndex + 1} ===`);
                        console.log('🆔 ID du message:', message.id);
                        console.log('📞 Numéro expéditeur:', message.from);
                        console.log('⏰ Timestamp:', new Date(parseInt(message.timestamp) * 1000).toLocaleString());
                        console.log('📝 Type de message:', message.type);
                        
                        // Traitement selon le type de message
                        switch (message.type) {
                            case 'text':
                                console.log('📄 Contenu texte:', message.text.body);
                                break;
                            case 'image':
                                console.log('🖼️ Image reçue:', message.image);
                                break;
                            case 'audio':
                                console.log('🎵 Audio reçu:', message.audio);
                                break;
                            case 'video':
                                console.log('🎥 Vidéo reçue:', message.video);
                                break;
                            case 'document':
                                console.log('📎 Document reçu:', message.document);
                                break;
                            case 'location':
                                console.log('📍 Localisation reçue:', message.location);
                                break;
                            default:
                                console.log('❓ Type de message non géré:', message.type);
                        }
                    });
                }
                
                // Informations sur les contacts
                if (change.value && change.value.contacts) {
                    console.log('\n👤 === INFORMATIONS CONTACT ===');
                    change.value.contacts.forEach(contact => {
                        console.log('📱 WhatsApp ID:', contact.wa_id);
                        console.log('👤 Nom du profil:', contact.profile?.name || 'Non défini');
                    });
                }
                
                // Statuts des messages
                if (change.value && change.value.statuses) {
                    console.log('\n📊 === STATUTS MESSAGES ===');
                    change.value.statuses.forEach(status => {
                        console.log('📨 Message ID:', status.id);
                        console.log('📍 Statut:', status.status);
                        console.log('⏰ Timestamp:', new Date(parseInt(status.timestamp) * 1000).toLocaleString());
                    });
                }
            });
        }
        
        // Réponse obligatoire à WhatsApp
        res.status(200).send('EVENT_RECEIVED');
    } else {
        console.log('❌ Ce n\'est pas un message WhatsApp Business');
        console.log('Object type reçu:', body.object);
        res.sendStatus(404);
    }
});

// Page d'accueil avec informations
app.get('/', (req, res) => {
    res.json({
        status: '🚀 Webhook WhatsApp NoDaysOff actif',
        service: 'WhatsApp Business API',
        endpoints: {
            webhook: '/webhook',
            verification: 'GET /webhook',
            messages: 'POST /webhook'
        },
        config: {
            verify_token: VERIFY_TOKEN,
            port: port
        },
        instructions: {
            meta_config: 'Utilisez /webhook comme endpoint dans Meta',
            callback_url: `${req.protocol}://${req.get('host')}/webhook`,
            verify_token: VERIFY_TOKEN
        },
        timestamp: new Date().toISOString()
    });
});

// Route de test
app.get('/test', (req, res) => {
    res.json({
        message: '✅ Test endpoint actif',
        timestamp: new Date().toISOString(),
        server: 'WhatsApp Webhook NoDaysOff'
    });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err);
    res.status(500).json({
        error: 'Erreur serveur interne',
        timestamp: new Date().toISOString()
    });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
    console.log(`❓ Route non trouvée: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: 'Endpoint non trouvé',
        available_endpoints: ['/', '/webhook', '/test'],
        method: req.method,
        path: req.originalUrl
    });
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`\n🌐 ===============================================`);
    console.log(`🌐 Serveur webhook actif sur le port ${port}`);
    console.log(`🌐 Endpoints disponibles:`);
    console.log(`🏠 Accueil: /`);
    console.log(`📨 Webhook: /webhook`);
    console.log(`🧪 Test: /test`);
    console.log(`🔑 Token de vérification: ${VERIFY_TOKEN}`);
    console.log(`🌐 ===============================================`);
    console.log(`\n⏳ En attente des messages WhatsApp...`);
});
