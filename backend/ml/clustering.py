import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from collections import defaultdict

BEHAVIOUR_LABELS = {
    0: "Subscription",
    1: "Utility",
    2: "Regular",
    3: "Impulse",
    4: "Occasional",
}


def cluster_merchants(transactions):
    merchant_data = defaultdict(list)
    for txn in transactions:
        if txn.get("type") != "debit":
            continue
        desc = txn.get("description", "")[:30]
        merchant_data[desc].append(txn)

    if len(merchant_data) < 5:
        return []

    features = []
    merchants = []

    for merchant, txns in merchant_data.items():
        amounts = [t["amount"] for t in txns]
        dates = sorted([t["date"] for t in txns])
        frequency = len(txns)
        avg_amount = np.mean(amounts)
        std_amount = np.std(amounts) if len(amounts) > 1 else 0

        # Days since last transaction
        from datetime import date as dt

        try:
            last_date = dt.fromisoformat(dates[-1])
            days_since = (dt.today() - last_date).days
        except:
            days_since = 30

        # Average interval between transactions
        if len(dates) > 1:
            try:
                intervals = [
                    (dt.fromisoformat(dates[i + 1]) - dt.fromisoformat(dates[i])).days
                    for i in range(len(dates) - 1)
                ]
                avg_interval = np.mean(intervals)
            except:
                avg_interval = 30
        else:
            avg_interval = 30

        features.append([frequency, avg_amount, std_amount, days_since, avg_interval])
        merchants.append(merchant)

    X = np.array(features)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    n_clusters = min(5, len(merchants))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)

    results = []
    for i, merchant in enumerate(merchants):
        results.append(
            {
                "merchant": merchant,
                "behaviour": BEHAVIOUR_LABELS.get(labels[i] % 5, "Regular"),
                "frequency": int(features[i][0]),
                "avg_amount": round(features[i][1], 2),
                "cluster": int(labels[i]),
            }
        )

    return sorted(results, key=lambda x: x["frequency"], reverse=True)
