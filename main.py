import pandas as pd
import numpy as np
from graphviz import Digraph
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import json

# Load data
df = pd.read_csv("data_cuaca_gorontalo.csv")

# --- PREPROCESSING LENGKAP ---

# 1. Convert date
df['date'] = pd.to_datetime(df['date'], errors='coerce')

# 2. Drop columns yang seluruhnya NaN
df = df.dropna(axis=1, how='all')

# 3. Tangani missing value numeric (isi median)
numeric_cols = df.select_dtypes(include=[np.number]).columns
df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

# 4. Buat label Hujan / Tidak Hujan
df['kategori_hujan'] = df['prcp'].apply(lambda x: "Hujan" if x > 0 else "Tidak Hujan")

# 5. Encode label
df['label'] = df['kategori_hujan'].map({"Tidak Hujan": 0, "Hujan": 1})

# 6. Pilih fitur final
features = ["tavg", "tmin", "tmax", "wspd", "pres"]
X = df[features]
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
# ============================
# GAIN, SPLIT INFO, GAIN RATIO
# ============================
def entropy(y):
    # y bisa pandas Series atau numpy array
    values, counts = np.unique(np.array(y), return_counts=True)
    probs = counts / counts.sum()
    # hande zero probs (shouldn't happen with np.unique)
    return -np.sum(probs * np.log2(probs + 1e-12))

def information_gain(y, left_y, right_y):
    H_before = entropy(y)
    H_after = (len(left_y)/len(y))*entropy(left_y) + (len(right_y)/len(y))*entropy(right_y)
    return H_before - H_after

def split_info(left_y, right_y):
    total = len(left_y) + len(right_y)
    p_left = len(left_y) / total
    p_right = len(right_y) / total
    info = 0.0
    if p_left > 0:
        info -= p_left * np.log2(p_left)
    if p_right > 0:
        info -= p_right * np.log2(p_right)
    return info

def gain_ratio(y, left_y, right_y):
    gain = information_gain(y, left_y, right_y)
    si = split_info(left_y, right_y)
    if si <= 0:
        return 0.0
    return gain / si

# ============================
# FIND BEST SPLIT (basic)
# ============================
def find_best_split(X, y):
    best_feature = None
    best_threshold = None
    best_gain_ratio = -np.inf

    for feature in X.columns:
        vals = np.sort(X[feature].dropna().unique())
        if len(vals) <= 1:
            continue
        candidate_thresholds = (vals[:-1] + vals[1:]) / 2.0
        for t in candidate_thresholds:
            left_mask = X[feature] <= t
            right_mask = X[feature] > t
            if left_mask.sum() == 0 or right_mask.sum() == 0:
                continue
            left_y = y[left_mask]
            right_y = y[right_mask]
            gr = gain_ratio(y, left_y, right_y)
            if gr > best_gain_ratio:
                best_gain_ratio = gr
                best_feature = feature
                best_threshold = t

    if best_gain_ratio == -np.inf:
        return None, None, 0.0

    return best_feature, best_threshold, best_gain_ratio

# ============================
# BUILD C4.5 TREE (with pre-pruning)
# ============================
def build_c45_tree(X, y, depth=0, max_depth=5, min_samples_split=10, min_gain=1e-6):
    # Jika semua kelas sama -> leaf
    if len(np.unique(y)) == 1:
        return {"type": "leaf", "label": int(np.array(y)[0])}

    # Jika feature habis atau sample kecil -> majority leaf
    if X.shape[1] == 0 or len(y) < min_samples_split or (max_depth is not None and depth >= max_depth):
        majority = int(pd.Series(y).mode().iat[0])
        return {"type": "leaf", "label": majority}

    # Cari split terbaik
    feature, threshold, best_gr = find_best_split(X, y)

    # Jika nggak ada split baik -> leaf mayoritas
    if feature is None or best_gr <= min_gain:
        majority = int(pd.Series(y).mode().iat[0])
        return {"type": "leaf", "label": majority}

    # Bagi dataset
    left_mask = X[feature] <= threshold
    right_mask = X[feature] > threshold

    # Safety: jika salah satu kosong -> leaf mayoritas
    if left_mask.sum() == 0 or right_mask.sum() == 0:
        majority = int(pd.Series(y).mode().iat[0])
        return {"type": "leaf", "label": majority}

    # Rekursif
    left_sub = build_c45_tree(X[left_mask], y[left_mask], depth+1, max_depth, min_samples_split, min_gain)
    right_sub = build_c45_tree(X[right_mask], y[right_mask], depth+1, max_depth, min_samples_split, min_gain)

    return {
        "type": "node",
        "feature": feature,
        "threshold": float(threshold),
        "gain_ratio": float(best_gr),
        "left": left_sub,
        "right": right_sub
    }
def export_tree_to_json(tree, output_file="tree.json"):
    def convert(node):
        if node["type"] == "leaf":
            return {
                "label": int(node["label"])
            }
        return {
            "feature": node["feature"],
            "threshold": float(node["threshold"]),
            "gain_ratio": float(node.get("gain_ratio", 0)),
            "left": convert(node["left"]),
            "right": convert(node["right"])
        }

    tree_json = convert(tree)

    with open(output_file, "w") as f:
        json.dump(tree_json, f, indent=4)

    print(f"✅ Tree JSON disimpan ke: {output_file}")
# ============================
# PREDICT FUNCTIONS
# ============================
def predict_single(tree, x):
    node = tree
    while node["type"] != "leaf":
        feat = node["feature"]
        thr = node["threshold"]
        if x[feat] <= thr:
            node = node["left"]
        else:
            node = node["right"]
    return node["label"]

def predict(tree, X):
    # X: DataFrame
    return np.array([predict_single(tree, row) for _, row in X.iterrows()])

# ============================
# VISUALIZE (GRAPHVIZ)
# ============================
def visualize_c45_tree(tree, feature_names=None, class_names=None, output_name="c45_tree", max_depth=4, fmt="svg"):
    dot = Digraph(output_name, format=fmt)
    dot.attr(rankdir="TB")

    decision_style = {"shape": "diamond", "style": "filled", "fillcolor": "lightblue", "fontname": "Arial"}
    leaf_style = {"shape": "box", "style": "filled", "fillcolor": "lightgreen", "fontname": "Arial"}

    def add_nodes(node, node_id):
        if node["type"] == "leaf":
            label = class_names[node["label"]] if class_names is not None else str(node["label"])
            dot.node(node_id, label, **leaf_style)
            return

        # internal
        feat = node["feature"]
        thr = node["threshold"]
        gr = node.get("gain_ratio", 0.0)
        text = f"{feat} ≤ {thr:.2f}\nGR={gr:.3f}"
        dot.node(node_id, text, **decision_style)

        # left
        left_id = node_id + "L"
        add_nodes(node["left"], left_id)
        dot.edge(node_id, left_id, label=f"{feat} ≤ {thr:.2f}")

        # right
        right_id = node_id + "R"
        add_nodes(node["right"], right_id)
        dot.edge(node_id, right_id, label=f"{feat} > {thr:.2f}")

    add_nodes(tree, "root")
    try:
        dot.render(output_name, cleanup=True)
        print(f"Diagram tersimpan sebagai {output_name}.{fmt}")
    except Exception as e:
        print("Gagal merender diagram Graphviz. Pastikan Graphviz terinstall di sistem. Error:", e)


class_names = ["Tidak Hujan", "Hujan"]

tree = build_c45_tree(
    X_train,
    y_train,
    max_depth=6,
    min_samples_split=20,
    min_gain=1e-4
)

# ✅ EXPORT KE JSON UNTUK WEB
export_tree_to_json(tree, "tree.json")

# ✅ VISUAL GRAPHVIZ TETAP JALAN
visualize_c45_tree(
    tree,
    feature_names=X.columns.tolist(),
    class_names=["Tidak Hujan", "Hujan"]
)

# ✅ EVALUASI
y_pred = predict(tree, X_test)

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred)
rec = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("Akurasi :", acc)
print("Precision :", prec)
print("Recall :", rec)
print("F1-score :", f1)

