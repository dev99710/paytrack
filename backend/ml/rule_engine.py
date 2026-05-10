from db import supabase

OPERATORS = {
    "equals": lambda a, b: str(a).lower() == str(b).lower(),
    "not_equals": lambda a, b: str(a).lower() != str(b).lower(),
    "contains": lambda a, b: str(b).lower() in str(a).lower(),
    "gt": lambda a, b: float(a) > float(b),
    "gte": lambda a, b: float(a) >= float(b),
    "lt": lambda a, b: float(a) < float(b),
    "lte": lambda a, b: float(a) <= float(b),
}


def fetch_rules(user_id):
    result = (
        supabase.table("rules")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .order("priority", desc=True)
        .execute()
    )
    return result.data or []


def evaluate_condition(condition, txn):
    field = condition.get("field")
    operator = condition.get("operator")
    value = condition.get("value")

    txn_value = txn.get(field)
    if txn_value is None:
        return False

    op_fn = OPERATORS.get(operator)
    if not op_fn:
        return False

    try:
        return op_fn(txn_value, value)
    except:
        return False


def apply_action(action, txn):
    action_type = action.get("type")
    value = action.get("value")

    if action_type == "set_category":
        txn["category"] = value
        txn["category_source"] = "rule_engine"
    elif action_type == "add_tag":
        tags = txn.get("tags") or []
        if value not in tags:
            tags.append(value)
        txn["tags"] = tags
    elif action_type == "flag":
        flags = txn.get("flags") or []
        if value not in flags:
            flags.append(value)
        txn["flags"] = flags
    elif action_type == "adjust_risk":
        txn["risk_score"] = float(value)

    return txn


def apply_rules(transactions, user_id):
    rules = fetch_rules(user_id)
    if not rules:
        return transactions

    results = []
    for txn in transactions:
        txn = dict(txn)
        for rule in rules:
            conditions = rule.get("conditions", [])
            actions = rule.get("actions", [])

            all_match = all(evaluate_condition(c, txn) for c in conditions)
            if all_match:
                for action in actions:
                    txn = apply_action(action, txn)

        results.append(txn)

    return results
