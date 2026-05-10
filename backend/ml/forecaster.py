import numpy as np
import pandas as pd
from collections import defaultdict


def forecast_spending(transactions, months_ahead=3):
    category_monthly = defaultdict(lambda: defaultdict(float))

    for txn in transactions:
        if txn.get("type") != "debit":
            continue
        try:
            month_key = txn["date"][:7]  # YYYY-MM
            cat = txn.get("category", "Uncategorised")
            category_monthly[cat][month_key] += txn["amount"]
        except:
            continue

    forecasts = {}

    for category, monthly in category_monthly.items():
        sorted_months = sorted(monthly.keys())
        values = [monthly[m] for m in sorted_months]

        if len(values) < 2:
            continue

        if len(values) >= 6:
            try:
                from statsmodels.tsa.arima.model import ARIMA

                model = ARIMA(values, order=(1, 1, 1))
                fit = model.fit()
                forecast = fit.forecast(steps=months_ahead)
                conf_int = fit.get_forecast(steps=months_ahead).conf_int(alpha=0.2)

                predictions = []
                for i in range(months_ahead):
                    predictions.append(
                        {
                            "month": f"Month +{i + 1}",
                            "forecast": round(max(0, forecast.iloc[i]), 2),
                            "lower_ci": round(max(0, conf_int.iloc[i, 0]), 2),
                            "upper_ci": round(max(0, conf_int.iloc[i, 1]), 2),
                            "method": "arima",
                        }
                    )
                forecasts[category] = predictions
                continue
            except:
                pass

        # Linear regression fallback
        x = np.arange(len(values))
        coeffs = np.polyfit(x, values, 1)
        predictions = []
        for i in range(months_ahead):
            val = max(0, coeffs[0] * (len(values) + i) + coeffs[1])
            predictions.append(
                {
                    "month": f"Month +{i + 1}",
                    "forecast": round(val, 2),
                    "lower_ci": round(val * 0.8, 2),
                    "upper_ci": round(val * 1.2, 2),
                    "method": "linear",
                }
            )
        forecasts[category] = predictions

    return forecasts
