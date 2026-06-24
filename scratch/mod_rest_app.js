const fs = require('fs');
let content = fs.readFileSync('../restaurant-partner-app/src/App.tsx', 'utf8');

// 1. Imports
content = content.replace(
  "import { collection, query, onSnapshot, doc, updateDoc, orderBy, getDocs, getDoc, setDoc, addDoc, serverTimestamp, increment } from 'firebase/firestore';",
  "import { collection, query, onSnapshot, doc, updateDoc, orderBy, getDocs, getDoc, setDoc, addDoc, serverTimestamp, increment, where } from 'firebase/firestore';"
);
if (!content.includes('AlertTriangle')) {
  content = content.replace("Star, UploadCloud", "Star, UploadCloud, AlertTriangle");
}

// 2. State
content = content.replace(
  "const [supportDetailsText, setSupportDetailsText] = useState('');",
  "const [supportDetailsText, setSupportDetailsText] = useState('');\n  const [restaurantRefunds, setRestaurantRefunds] = useState<any[]>([]);\n  const [refundResponseText, setRefundResponseText] = useState('');"
);

// 3. Listener
content = content.replace(
  "      unsubscribeDoc();\n    };\n  }, [restaurantId, currentRoute]);",
  "      unsubscribeDoc();\n      if(unsubscribeRefunds) unsubscribeRefunds();\n    };\n  }, [restaurantId, currentRoute]);"
);
content = content.replace(
  "    const unsubscribeDoc = onSnapshot(doc(db, 'restaurantSupportChats', restaurantId), (snapshot) => {",
  "    let unsubscribeRefunds = () => {};\n    try {\n      unsubscribeRefunds = onSnapshot(query(collection(db, 'refundRequests'), where('restaurantId', '==', restaurantId)), (snapshot) => {\n        setRestaurantRefunds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));\n      });\n    } catch (e) { console.warn('refund listener failed', e); }\n\n    const unsubscribeDoc = onSnapshot(doc(db, 'restaurantSupportChats', restaurantId), (snapshot) => {"
);

// 4. Action Card
const actionCardHtml = `            <button onClick={() => setCurrentRoute('/reviews')} style={styles.actionCard}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px' }}>
                <Star size={20} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Reviews</span>
            </button>
            <button onClick={() => setCurrentRoute('/refunds')} style={{...styles.actionCard, position: 'relative'}}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '10px', color: '#EF4444' }}>
                <AlertTriangle size={20} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Disputes</span>
              {restaurantRefunds.filter(r => r.status === 'Pending').length > 0 && (
                <span style={{ background: '#EF4444', color: '#FFF', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', position: 'absolute', top: '10px', right: '10px' }}>
                  {restaurantRefunds.filter(r => r.status === 'Pending').length}
                </span>
              )}
            </button>`;
content = content.replace(
  "            <button onClick={() => setCurrentRoute('/reviews')} style={styles.actionCard}>\n              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px' }}>\n                <Star size={20} />\n              </div>\n              <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Reviews</span>\n            </button>",
  actionCardHtml
);

// 5. Sidebar Link
const sidebarHtml = `          <button 
            onClick={() => setCurrentRoute('/inventory')}
            style={{
              background: 'none',
              border: 'none',
              color: currentRoute === '/inventory' ? 'var(--brand-orange)' : 'var(--brand-muted)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Package size={20} />
            <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>Stock</span>
          </button>

          <button 
            onClick={() => setCurrentRoute('/refunds')}
            style={{
              background: 'none',
              border: 'none',
              color: currentRoute === '/refunds' ? 'var(--brand-orange)' : 'var(--brand-muted)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <AlertTriangle size={20} />
            <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>Disputes</span>
          </button>`;
content = content.replace(
  "          <button \n            onClick={() => setCurrentRoute('/inventory')}\n            style={{\n              background: 'none',\n              border: 'none',\n              color: currentRoute === '/inventory' ? 'var(--brand-orange)' : 'var(--brand-muted)',\n              cursor: 'pointer',\n              display: 'flex',\n              flexDirection: 'column',\n              alignItems: 'center',\n              gap: '4px'\n            }}\n          >\n            <Package size={20} />\n            <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>Stock</span>\n          </button>",
  sidebarHtml
);

// 6. Refunds Route View
const refundRouteView = `
      {/* Route: Refund Disputes Screen */}
      {currentRoute === '/refunds' && (
        <div className="animate-fade-in" style={{ padding: '24px', paddingBottom: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <button onClick={() => setCurrentRoute('/dashboard')} style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={20} />
            </button>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Refund Disputes</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {restaurantRefunds.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--brand-muted)' }}>No refund requests found.</div>
            ) : (
              restaurantRefunds.map(refund => (
                <div key={refund.id} className="glass-card premium-border" style={{ padding: '16px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Order {refund.orderId}</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--brand-muted)' }}>{refund.createdAt}</p>
                    </div>
                    <div style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', 
                      backgroundColor: refund.status === 'Pending' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                      color: refund.status === 'Pending' ? '#F59E0B' : '#10B981'
                    }}>
                      {refund.status}
                    </div>
                  </div>
                  
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}><strong>Customer Issue:</strong> {refund.reason}</p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#EF4444' }}><strong>Requested Amount:</strong> ₹{refund.amount} ({refund.type})</p>
                    {refund.items && refund.items.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--brand-muted)', marginBottom: '8px' }}>
                        <strong>Items:</strong> {refund.items.map(i => \`\${i.quantity}x \${i.name}\`).join(', ')}
                      </div>
                    )}
                    {refund.evidenceUrl && (
                      <a href={refund.evidenceUrl} target="_blank" rel="noreferrer" style={{ color: '#FF8C55', fontSize: '0.8rem', textDecoration: 'underline' }}>View Photo Evidence</a>
                    )}
                  </div>

                  {refund.status === 'Pending' && !refund.restaurantResponse && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <textarea
                        value={refundResponseText}
                        onChange={(e) => setRefundResponseText(e.target.value)}
                        placeholder="Provide your explanation or evidence against this refund..."
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#FFF', fontSize: '0.9rem', resize: 'vertical' }}
                        rows={3}
                      />
                      <button
                        onClick={async () => {
                          if (!refundResponseText.trim()) return alert("Please provide a response.");
                          try {
                            await updateDoc(doc(db, 'refundRequests', refund.id), {
                              restaurantResponse: refundResponseText,
                              status: 'Under Admin Review',
                              respondedAt: new Date().toLocaleString()
                            });
                            setRefundResponseText('');
                            alert("Response submitted to Admin for review.");
                          } catch (err) { alert(err.message); }
                        }}
                        style={{ background: '#FF8C55', color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Submit Response to Admin
                      </button>
                    </div>
                  )}

                  {refund.restaurantResponse && (
                    <div style={{ padding: '10px', background: 'rgba(59,130,246,0.1)', borderLeft: '3px solid #3B82F6', borderRadius: '4px' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#93C5FD' }}><strong>Your Response:</strong> {refund.restaurantResponse}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
`;

content = content.replace("{/* Route: Profile Settings */}", refundRouteView + "\n      {/* Route: Profile Settings */}");

fs.writeFileSync('../restaurant-partner-app/src/App.tsx', content);
console.log("Restaurant Partner App modified.");
