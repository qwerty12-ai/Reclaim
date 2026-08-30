USE reclaim;

INSERT INTO cases (
    id,
    customer_name,
    customer_email,
    amount,
    currency,
    issue_type,
    status,
    risk_score
) VALUES 
(
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
    'case-003',
    'Rahul Verma',
    'rahul@example.com',
    49999.00,
    'INR',
    'subscription_failure',
    'recovering',
    54
);