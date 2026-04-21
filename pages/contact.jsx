import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const handleSubmit = async () => {
    if (!form.email || !form.message) return;
    setStatus('sending');
    // Envoie vers mailto (solution simple sans backend)
    // Pour une vraie intégration : Formspree, Resend, ou EmailJS
    const subject = encodeURIComponent(`[ReviewSense] ${form.sujet || 'Contact'}`);
    const body = encodeURIComponent(
      `Nom: ${form.nom}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
    );
    window.open(`mailto:contact@ona-asso.fr?subject=${subject}&body=${body}`);
    setStatus('sent');
  };

  return (
    <>
      <Head>
        <title>Contact — ReviewSense by ONA</title>
        <meta name="description" content="Contactez l'équipe ONA pour toute question sur ReviewSense, partenariat ou demande de démonstration." />
        <meta property="og:title" content="Contact — ReviewSense by ONA" />
        <meta property="og:description" content="Contactez-nous pour toute question sur ReviewSense." />
      </Head>

      <style jsx>{`
        .page { max-width: 760px; margin: 0 auto; padding: 60px 24px; }
        .back { display: inline-flex; align-items: center; gap: 8px; color: #7c5cbf; font-weight: 600; font-size: 0.9rem; text-decoration: none; margin-bottom: 40px; }
        h1 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 2.4rem; font-weight: 800; color: #1a1525; letter-spacing: -1.5px; margin-bottom: 12px; }
        .subtitle { font-size: 1.05rem; color: #7a6d8a; margin-bottom: 48px; line-height: 1.7; }
        .grid { display: grid; grid-template-columns: 1fr 1.6fr; gap: 48px; }
        .info-block { display: flex; flex-direction: column; gap: 24px; }
        .info-card { background: rgba(255,255,255,0.8); border: 1px solid rgba(197,184,248,0.3); border-radius: 16px; padding: 20px; }
        .info-card-icon { font-size: 1.4rem; margin-bottom: 8px; }
        .info-card-title { font-weight: 700; color: #1a1525; font-size: 0.9rem; margin-bottom: 4px; }
        .info-card-text { font-size: 0.85rem; color: #7a6d8a; line-height: 1.6; }
        .info-card-text a { color: #7c5cbf; text-decoration: none; font-weight: 600; }
        .form-card { background: rgba(255,255,255,0.85); border: 1px solid rgba(197,184,248,0.3); border-radius: 20px; padding: 32px; backdrop-filter: blur(12px); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        label { font-size: 0.82rem; font-weight: 600; color: #7a6d8a; letter-spacing: 0.5px; }
        input, select, textarea { background: rgba(255,255,255,0.95); border: 1.5px solid rgba(197,184,248,0.4); border-radius: 12px; padding: 12px 16px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; color: #1a1525; outline: none; width: 100%; transition: border-color 0.2s; }
        input:focus, textarea:focus, select:focus { border-color: #b08fe0; box-shadow: 0 0 0 3px rgba(176,143,224,0.1); }
        textarea { min-height: 140px; resize: vertical; line-height: 1.6; }
        .submit-btn { width: 100%; padding: 15px; background: linear-gradient(135deg, #7c5cbf, #d4609a); color: white; font-family: 'Bricolage Grotesque', sans-serif; font-size: 1rem; font-weight: 700; border-radius: 12px; border: none; cursor: pointer; transition: all 0.3s; box-shadow: 0 6px 24px rgba(124,92,191,0.25); margin-top: 8px; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(124,92,191,0.35); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .success-msg { text-align: center; padding: 20px; background: rgba(39,174,96,0.1); border: 1px solid rgba(39,174,96,0.3); border-radius: 12px; color: #27ae60; font-weight: 600; margin-top: 16px; }
        @media(max-width: 640px) { .grid { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } h1 { font-size: 1.9rem; } }
      `}</style>

      <div style={{background: '#faf8ff', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif",
        backgroundImage: 'radial-gradient(ellipse at 10% 20%, rgba(197,184,248,0.3) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(255,200,168,0.25) 0%, transparent 50%)'}}>
        <div style={{padding: '20px 24px', borderBottom: '1px solid rgba(197,184,248,0.3)', background: 'rgba(250,248,255,0.9)', backdropFilter: 'blur(12px)'}}>
          <Link href="/" style={{fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.3rem', fontWeight: 800, background: 'linear-gradient(135deg, #7c5cbf, #d4609a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none'}}>
            Review<span style={{background: 'linear-gradient(135deg, #d4609a, #f4a261)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Sense</span>
          </Link>
        </div>

        <div className="page">
          <Link href="/" className="back">← Retour</Link>
          <h1>Contactez-nous</h1>
          <p className="subtitle">Une question, une demande de démo, un partenariat ? L'équipe ONA répond dans les 48h.</p>

          <div className="grid">
            <div className="info-block">
              <div className="info-card">
                <div className="info-card-icon">📧</div>
                <div className="info-card-title">Email</div>
                <div className="info-card-text">
                  <a href="mailto:contact@ona-asso.fr">contact@ona-asso.fr</a>
                </div>
              </div>
              <div className="info-card">
                <div className="info-card-icon">🌐</div>
                <div className="info-card-title">ONA Association</div>
                <div className="info-card-text">
                  <a href="https://ona-asso.fr" target="_blank" rel="noreferrer">ona-asso.fr</a><br/>
                  Association loi 1901<br/>
                  Bordeaux, France
                </div>
              </div>
              <div className="info-card">
                <div className="info-card-icon">🤝</div>
                <div className="info-card-title">Partenariats agences</div>
                <div className="info-card-text">Vous gérez des clients TPE/PME ? Proposez ReviewSense en marque blanche avec une commission de 30%.</div>
              </div>
              <div className="info-card">
                <div className="info-card-icon">📅</div>
                <div className="info-card-title">Prise de RDV</div>
                <div className="info-card-text"><a href="https://calendly.com/ona-action/30min" target="_blank" rel="noreferrer">Réserver un créneau de 30 min</a> pour une démo ou un accompagnement.</div>
              </div>
            </div>

            <div className="form-card">
              {status === 'sent' ? (
                <div className="success-msg">
                  ✅ Votre message a été préparé dans votre client email.<br/>
                  <span style={{fontSize:'0.85rem', fontWeight: 400, color: '#5a8a6a', marginTop: '8px', display: 'block'}}>
                    Si la fenêtre ne s'est pas ouverte, écrivez directement à contact@ona-asso.fr
                  </span>
                </div>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nom / Prénom</label>
                      <input type="text" placeholder="Jean Dupont" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input type="email" placeholder="jean@monentreprise.fr" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Sujet</label>
                    <select value={form.sujet} onChange={e => setForm({...form, sujet: e.target.value})}>
                      <option value="">Sélectionnez un sujet</option>
                      <option value="Demande de démo">Demande de démo</option>
                      <option value="Partenariat agence">Partenariat agence</option>
                      <option value="Question technique">Question technique</option>
                      <option value="Bug ou problème">Bug ou problème</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Message *</label>
                    <textarea
                      placeholder="Décrivez votre demande, votre secteur d'activité, le nombre d'établissements que vous gérez..."
                      value={form.message}
                      onChange={e => setForm({...form, message: e.target.value})}
                    />
                  </div>
                  <button className="submit-btn" onClick={handleSubmit} disabled={!form.email || !form.message || status === 'sending'}>
                    {status === 'sending' ? 'Envoi…' : '✦ Envoyer le message'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
