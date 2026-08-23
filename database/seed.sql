USE reclaim;

INSERT INTO cases (
    id,
    case_id,
    customer_name,
    customer_email,
    amount,
    currency,
    issue_type,
    status,
    risk_score
) VALUES 
(
    UUID(),
    'case-001',
    'Aarav Sharma',
    'aarva@example.com',
    24999.00,
    'INR',
    'payment_failure',
    'at_risk',
    82
),
(
    UUID(),
    'case-002',
    'Priya Mehta',
    'priya@example.com',
    12999.00,
    'INR',
    'checkout_abandonment',
    'at_risk',
    67
),
(
    UUID(),
    'case-003',
    'Rahul Verma',
    'rahul@example.com',
    49999.00,
    'INR',
    'subscription_failure',
    'recovering',
    54
);

INSERT INTO recovery_executions (
    id,
    case_id,
    action,
    status,
    amount_recovered,
    reason
) VALUES
(
    UUID(),
    'case-001',
    'payment_retry',
    'executed',
    0.00,
    'Recovery action payment_retry executed and awaiting payment confirmation.'
),
(
    UUID(),
    'case-002',
    'checkout_recovery',
    'executed',
    0.00,
    'Checkout recovery action executed and awaiting customer payment completion.'
),
(
    UUID(),
    'case-003',
    'subscription_recovery',
    'stopped',
    0.00,
    'Recovery execution stopped because the case is already in recovering status.'
);