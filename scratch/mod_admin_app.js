const fs = require('fs');
let content = fs.readFileSync('../admin-panel/src/App.jsx', 'utf8');

// 1. Update handleRefundRequestAction
const oldHandle = `  const handleRefundRequestAction = async (refId, status) => {
    try {
      const refund = mergedRefundRequests.find(r => r.id === refId);
      if (!refund) {
        alert("Refund request not found.");
        return;
      }

      const custId = refund.customerId;
      const cust = users.find(u => u.id === custId);

      // 1. Update refund status
      const refundPayload = { status, updatedAt: new Date().toLocaleString() };
      try {
        await setDoc(doc(db, 'refundRequests', refId), refundPayload, { merge: true });
      } catch (e) {
        console.warn("refundRequests write blocked, using prefix", e.message);
        await setDoc(doc(db, 'orders', \`refundRequests_\${refId}\`), refundPayload, { merge: true });
      }

      // 2. Adjust customer balance if approved or completed
      if (status === 'Approved' || status === 'Completed') {
        if (cust) {
          const amount = Number(refund.amount) || 0;
          const oldBalance = Number(cust.walletBalance) || 0;
          const newBalance = oldBalance + amount;

          // Update customer walletBalance
          await updateDoc(doc(db, 'users', custId), { walletBalance: newBalance });

          // Create transaction in refundTransactions
          const txId = 'ref_tx_' + Date.now();
          const txPayload = {
            id: txId,
            orderId: refund.orderId || '',
            customerId: custId,
            customerName: cust.name,
            amount: amount,
            status: 'completed',
            description: \`Order Refund Approved - ID: \${refId}\`,
            createdAt: new Date().toLocaleString()
          };
          try {
            await setDoc(doc(db, 'refundTransactions', txId), txPayload);
          } catch (e) {
            console.warn("refundTransactions write blocked, using prefix", e.message);
            await setDoc(doc(db, 'orders', \`refundTransactions_\${txId}\`), txPayload);
          }
        }
      }`;

const newHandle = `  const handleRefundRequestAction = async (refId, status, customAmount, destination = 'Wallet') => {
    try {
      const refund = mergedRefundRequests.find(r => r.id === refId);
      if (!refund) {
        alert("Refund request not found.");
        return;
      }

      const custId = refund.customerId;
      const cust = users.find(u => u.id === custId);
      
      const finalAmount = customAmount !== undefined ? Number(customAmount) : (Number(refund.amount) || 0);

      // 1. Update refund status
      const refundPayload = { status, amount: finalAmount, destination, updatedAt: new Date().toLocaleString() };
      try {
        await setDoc(doc(db, 'refundRequests', refId), refundPayload, { merge: true });
      } catch (e) {
        console.warn("refundRequests write blocked, using prefix", e.message);
        await setDoc(doc(db, 'orders', \`refundRequests_\${refId}\`), refundPayload, { merge: true });
      }

      // 2. Adjust customer balance if approved or completed
      if (status === 'Approved' || status === 'Completed') {
        if (cust) {
          if (destination === 'Wallet' || destination === 'Store Credit') {
            const oldBalance = Number(cust.walletBalance) || 0;
            const newBalance = oldBalance + finalAmount;
            // Update customer walletBalance
            await updateDoc(doc(db, 'users', custId), { walletBalance: newBalance });
          }

          // Create transaction in refundTransactions
          const txId = 'ref_tx_' + Date.now();
          const txPayload = {
            id: txId,
            orderId: refund.orderId || '',
            customerId: custId,
            customerName: cust?.name || 'Customer',
            amount: finalAmount,
            status: 'completed',
            destination: destination,
            description: \`Order Refund (\${destination}) - ID: \${refId}\`,
            createdAt: new Date().toLocaleString()
          };
          try {
            await setDoc(doc(db, 'refundTransactions', txId), txPayload);
          } catch (e) {
            console.warn("refundTransactions write blocked, using prefix", e.message);
            await setDoc(doc(db, 'orders', \`refundTransactions_\${txId}\`), txPayload);
          }
        }
      }`;

content = content.replace(oldHandle, newHandle);

// 2. Update RefundDeskView
const oldViewStart = `  function RefundDeskView() {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>`;

const newViewStart = `  function RefundDeskView() {
    const [refundInputs, setRefundInputs] = useState({});

    const handleInputChange = (id, field, value) => {
      setRefundInputs(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value
        }
      }));
    };

    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>`;

content = content.replace(oldViewStart, newViewStart);

const oldRow = `                  <td>{r.reason}</td>
                  <td>{r.createdAt}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                      backgroundColor: r.status === 'Completed' || r.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : r.status === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: r.status === 'Completed' || r.status === 'Approved' ? 'var(--success)' : r.status === 'Rejected' ? 'var(--error)' : 'var(--warning)'
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {r.status === 'Pending' && (
                        <>
                          <button onClick={() => handleRefundRequestAction(r.id, 'Approved')} className="orange-glow-btn" style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--success)' }}>Approve</button>
                          <button onClick={() => handleRefundRequestAction(r.id, 'Rejected')} className="orange-glow-btn" style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--error)' }}>Reject</button>
                        </>
                      )}
                      {r.status === 'Approved' && (
                        <button onClick={() => handleRefundRequestAction(r.id, 'Completed')} className="orange-glow-btn" style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--info)' }}>Mark Completed</button>
                      )}
                      {r.status !== 'Pending' && r.status !== 'Approved' && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Closed</span>
                      )}
                    </div>
                  </td>`;

const newRow = `                  <td>
                    <div>{r.reason}</div>
                    {r.items && r.items.length > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <strong>Items:</strong> {r.items.map(i => \`\${i.quantity}x \${i.name}\`).join(', ')}
                      </div>
                    )}
                    {r.evidenceUrl && (
                      <a href={r.evidenceUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#3B82F6', textDecoration: 'underline', display: 'block', marginTop: '4px' }}>View Evidence</a>
                    )}
                    {r.restaurantResponse && (
                      <div style={{ padding: '4px', background: 'rgba(59,130,246,0.1)', borderLeft: '2px solid #3B82F6', marginTop: '8px', fontSize: '11px', color: '#93C5FD' }}>
                        <strong>Rest. Response:</strong> {r.restaurantResponse}
                      </div>
                    )}
                  </td>
                  <td>{r.createdAt}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                      backgroundColor: r.status === 'Completed' || r.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : r.status === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : r.status === 'Under Admin Review' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: r.status === 'Completed' || r.status === 'Approved' ? 'var(--success)' : r.status === 'Rejected' ? 'var(--error)' : r.status === 'Under Admin Review' ? '#3B82F6' : 'var(--warning)'
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                      {(r.status === 'Pending' || r.status === 'Under Admin Review') && (
                        <>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              type="number" 
                              placeholder="Amount" 
                              value={refundInputs[r.id]?.amount !== undefined ? refundInputs[r.id].amount : r.amount}
                              onChange={(e) => handleInputChange(r.id, 'amount', e.target.value)}
                              style={{ width: '80px', padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: '#FFF' }}
                            />
                            <select 
                              value={refundInputs[r.id]?.dest || 'Wallet'}
                              onChange={(e) => handleInputChange(r.id, 'dest', e.target.value)}
                              style={{ padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: '#FFF' }}
                            >
                              <option value="Wallet">Wallet</option>
                              <option value="Original Payment Method">Original Payment Method</option>
                              <option value="Store Credit">Store Credit</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleRefundRequestAction(r.id, 'Approved', refundInputs[r.id]?.amount !== undefined ? refundInputs[r.id].amount : r.amount, refundInputs[r.id]?.dest || 'Wallet')} className="orange-glow-btn" style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--success)' }}>Approve</button>
                            <button onClick={() => handleRefundRequestAction(r.id, 'Rejected')} className="orange-glow-btn" style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--error)' }}>Reject</button>
                          </div>
                        </>
                      )}
                      {r.status === 'Approved' && (
                        <button onClick={() => handleRefundRequestAction(r.id, 'Completed')} className="orange-glow-btn" style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--info)' }}>Mark Completed</button>
                      )}
                      {r.status !== 'Pending' && r.status !== 'Under Admin Review' && r.status !== 'Approved' && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Closed</span>
                      )}
                    </div>
                  </td>`;

content = content.replace(oldRow, newRow);

fs.writeFileSync('../admin-panel/src/App.jsx', content);
console.log("Admin Panel App modified.");
