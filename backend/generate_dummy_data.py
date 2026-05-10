import csv
import random
from datetime import date, timedelta

random.seed(42)

TRANSACTIONS = [
    # Food & Dining
    ("UPI/HDFC0001/Swiggy Order", "debit", 180, 650),
    ("UPI/PYTM0002/Zomato Food", "debit", 220, 580),
    ("POS/DOMINOS PIZZA/MG Road", "debit", 350, 900),
    ("UPI/PHONEPE/KFC Ahmedabad", "debit", 280, 520),
    ("POS/CAFE COFFEE DAY/CG Road", "debit", 180, 320),
    # Shopping
    ("UPI/AMAZON PAY/Amazon.in", "debit", 299, 8999),
    ("UPI/FLIPKART/Payment", "debit", 499, 5999),
    ("POS/MYNTRA FASHION/Online", "debit", 799, 3499),
    ("UPI/MEESHO/Order Payment", "debit", 199, 1299),
    ("POS/DMART/Ahmedabad", "debit", 800, 4200),
    # Transport
    ("UPI/UBER INDIA/Ride", "debit", 80, 350),
    ("UPI/OLA/Cab Booking", "debit", 90, 280),
    ("IRCTC/TICKET BOOKING/PNR", "debit", 450, 2800),
    ("POS/BPCL PETROL/Chandkheda", "debit", 1000, 3000),
    ("UPI/RAPIDO/Auto Ride", "debit", 40, 120),
    # Utilities
    ("BESCOM/ELECTRICITY BILL/Account", "debit", 800, 2400),
    ("AIRTEL/POSTPAID BILL/Mobile", "debit", 399, 799),
    ("JIO/BROADBAND/Monthly", "debit", 699, 999),
    ("TORRENT GAS/PIPED GAS/Bill", "debit", 300, 600),
    ("UPI/PAYTM/DTH Recharge", "debit", 200, 350),
    # Groceries
    ("UPI/BIGBASKET/Grocery", "debit", 600, 2800),
    ("UPI/BLINKIT/Quick Commerce", "debit", 350, 1200),
    ("UPI/ZEPTO/Grocery Delivery", "debit", 280, 980),
    ("POS/RELIANCE FRESH/Chandkheda", "debit", 400, 1800),
    # Entertainment
    ("NETFLIX/SUBSCRIPTION/Monthly", "debit", 649, 649),
    ("SPOTIFY/PREMIUM/Monthly", "debit", 119, 119),
    ("UPI/BOOKMYSHOW/Movie Ticket", "debit", 280, 560),
    ("AMAZON PRIME/SUBSCRIPTION", "debit", 299, 299),
    # Healthcare
    ("UPI/APOLLO PHARMACY/Medicine", "debit", 200, 1800),
    ("POS/NETMEDS/Online Pharmacy", "debit", 350, 900),
    ("HDFC ERGO/HEALTH INSURANCE/Premium", "debit", 2500, 2500),
    # Finance / EMI
    ("BAJAJ FINANCE/EMI/Loan", "debit", 3200, 3200),
    ("LIC/PREMIUM/Policy", "debit", 4500, 4500),
    ("ZERODHA/SIP/Mutual Fund", "debit", 2000, 5000),
    # Salary (credit)
    ("SALARY/BRAINYBEAM TECH/NEFT", "credit", 28000, 32000),
    # UPI Transfers
    ("UPI/PHONEPE/Send Money", "debit", 500, 5000),
    ("UPI/GPAY/Transfer", "debit", 1000, 10000),
    ("NEFT/TRANSFER/Personal", "credit", 2000, 8000),
    # ATM
    ("ATM/CASH WITHDRAWAL/SBI ATM", "debit", 2000, 5000),
]

ANOMALIES = [
    ("UPI/UNKNOWN/Transfer/9876543210", "debit", 48000, 48000),
    ("UPI/HDFC0001/Swiggy Order", "debit", 349, 349),
    ("UPI/HDFC0001/Swiggy Order", "debit", 349, 349),
    ("NEFT/WIRE/Unknown Beneficiary", "debit", 25000, 25000),
    ("UPI/UNKNOWN MERCHANT/QR Pay", "debit", 15000, 15000),
]


def generate(months=6, output="dummy_statement.csv"):
    rows = []
    today = date.today()
    start = today - timedelta(days=months * 30)
    current_date = start
    balance = 45000.0

    while current_date <= today:
        num_txns = random.randint(2, 6)
        for _ in range(num_txns):
            desc, txn_type, min_amt, max_amt = random.choice(TRANSACTIONS)
            amount = round(random.uniform(min_amt, max_amt), 2)

            if txn_type == "debit":
                balance -= amount
            else:
                balance += amount

            if balance < 2000:
                balance += 15000

            rows.append(
                {
                    "Date": current_date.strftime("%d/%m/%Y"),
                    "Narration": desc,
                    "Withdrawal Amt": round(amount, 2) if txn_type == "debit" else "",
                    "Deposit Amt": round(amount, 2) if txn_type == "credit" else "",
                    "Closing Balance": round(balance, 2),
                }
            )

        current_date += timedelta(days=1)

    # Inject anomalies spread across months
    for desc, txn_type, min_amt, max_amt in ANOMALIES:
        amount = round(random.uniform(min_amt, max_amt), 2)
        random_date = start + timedelta(days=random.randint(0, months * 30))
        balance -= amount
        rows.append(
            {
                "Date": random_date.strftime("%d/%m/%Y"),
                "Narration": desc,
                "Withdrawal Amt": amount if txn_type == "debit" else "",
                "Deposit Amt": amount if txn_type == "credit" else "",
                "Closing Balance": round(balance, 2),
            }
        )

    # Sort by date
    rows.sort(key=lambda r: r["Date"].split("/")[::-1])

    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "Date",
                "Narration",
                "Withdrawal Amt",
                "Deposit Amt",
                "Closing Balance",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} transactions → {output}")
    print(f"Date range: {start} to {today}")


if __name__ == "__main__":
    generate(months=6, output="dummy_statement.csv")
