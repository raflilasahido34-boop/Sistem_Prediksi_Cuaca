// script.js (updated)
// - Keeps nodes as <rect>
// - Safe node IDs via unique uid assigned during conversion
// - Highlights rect + text on prediction path
// - Auto-predict on input change and button click
// - Removes Cloudflare injection block (if any)

const defaultConfig = {
    background_gradient_start: "#667eea",
    background_gradient_end: "#764ba2",
    card_background: "#ffffff",
    primary_accent: "#667eea",
    text_primary: "#2d3748",
    text_secondary: "#4a5568",
    font_family: "Inter",
    font_size: 16,
    app_title: "Gorontalo Weather",
    location_name: "Gorontalo, Indonesia",
    temperature: "28°C",
    weather_condition: "Partly Cloudy",
    humidity: "75%",
    wind_speed: "12 km/h",
    prediction_title: "Weather Prediction (C4.5 Algorithm)",
    footer_text: "Data updated every 30 minutes • Powered by C4.5 Decision Tree Algorithm"
};

const featureLabelMap = {
    tmin: "Suhu Minimum (°C)",
    tavg: "Suhu Rata-rata (°C)",
    wspd: "Kecepatan Angin (km/jam)"
};

// Global holders
let decisionTree = null;           // raw tree (left/right structure)
let rawNodeToUid = new Map();      // maps raw node object -> uid (number)
let uidCounter = 0;                // uid generator
let d3data = null;                 // converted tree for d3 (with children array)

/* -------------------------
   Helpers
   ------------------------- */
function safeThresholdStr(val) {
    // convert number to a stable string (3 decimal places), then replace dots -> underscore
    if (val === undefined || val === null) return "na";
    return Number(val).toFixed(3).replace(/\./g, "_");
}

function assignUidToRawNode(node) {
    // assign and return uid for a raw node reference
    if (!rawNodeToUid.has(node)) {
        uidCounter += 1;
        rawNodeToUid.set(node, uidCounter);
    }
    return rawNodeToUid.get(node);
}

/* -------------------------
   Convert raw tree -> d3-friendly tree
   Also populate rawNodeToUid mapping
   ------------------------- */
function convertToD3Format(node) {
    if (!node) return null;

    // shallow copy so we don't mutate original raw object structure
    const newNode = Object.assign({}, node);

    // assign uid for identification
    const uid = assignUidToRawNode(node);
    newNode.__uid = uid;

    // children for d3
    if (node.left || node.right) {
        newNode.children = [];
        if (node.left) newNode.children.push(convertToD3Format(node.left));
        if (node.right) newNode.children.push(convertToD3Format(node.right));
    }

    return newNode;
}

/* -------------------------
   Draw tree using d3
   Nodes are rect + text.
   Each node group has id = node-<uid>
   ------------------------- */
function drawTree(data) {
    if (!data) return;

    const svgEl = d3.select("#treeCanvas")
        .html("")
        .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svgEl.append("g");

    const root = d3.hierarchy(data);

    const treeLayout = d3.tree()
        .nodeSize([90, 260])
        .separation((a, b) => a.parent === b.parent ? 1.6 : 2.4);

    treeLayout(root);

    const allNodes = root.descendants();

    // hitung batas tree
    const minX = d3.min(allNodes, d => d.x);
    const maxX = d3.max(allNodes, d => d.x);
    const minY = d3.min(allNodes, d => d.y);
    const maxY = d3.max(allNodes, d => d.y);

    const paddingX = 140;
    const paddingY = 100;

    const viewWidth = maxY - minY + paddingX * 2;
    const viewHeight = maxX - minX + paddingY * 2;
    const gLinks = g.append("g").attr("class", "links");
    const gNodes = g.append("g").attr("class", "nodes");
    // ⬅️ INI KUNCI UTAMA (ANTI KEPOTONG)
    svgEl.attr(
        "viewBox",
        `${minY - paddingX} ${minX - paddingY} ${viewWidth} ${viewHeight}`
    );
            /* ===== BRANCH LABELS ===== */
    const linkGen = d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x);
    /* ===== SHADOW ===== */
    const defs = g.append("defs");
    defs.append("filter")
        .attr("id", "shadow")
        .append("feDropShadow")
        .attr("dx", 0)
        .attr("dy", 4)
        .attr("stdDeviation", 6)
        .attr("flood-opacity", 0.25);

    g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", linkGen)
        .attr("fill", "none")
        .attr("stroke", "#c7d2fe")
        .attr("stroke-width", 2.2);

    /* ===== NODES ===== */
    const nodeGroup = gNodes.selectAll(".node")
        .data(allNodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`);



    nodeGroup.append("rect")
        .attr("x", -85)
        .attr("y", -30)
        .attr("width", 170)
        .attr("height", 60)
        .attr("rx", 12)
        .attr("ry", 12)
        .attr("filter", "url(#shadow)")
        .attr("fill", d =>
            d.children
                ? "#6366f1"
                : d.data.label === 1 ? "#16a34a" : "#dc2626"
        );
        
    nodeGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .each(function (d) {
            const t = d3.select(this);
            if (d.data.feature) {
                t.append("tspan")
                    .attr("x", 0)
                    .attr("dy", "-0.2em")
                    .text(featureLabelMap[d.data.feature] || d.data.feature);

                if (!isNaN(d.data.threshold)) {
                    t.append("tspan")
                        .attr("x", 0)
                        .attr("dy", "1.3em")
                        .style("font-weight", "400")
                        .text(`≤ ${Number(d.data.threshold).toFixed(2)}`);
                }
            } else {
                t.text(d.data.label === 1 ? "HUJAN 🌧️" : "TIDAK HUJAN ☀️");
            }
        });
    

    const linkGroups = gLinks.selectAll(".link-group")
        .data(root.links())
        .enter()
        .append("g")
        .attr("class", "link-group");

    // garis
    linkGroups.append("path")
        .attr("class", "link")
        .attr("d", linkGen)
        .attr("fill", "none")
        .attr("stroke", "#c7d2fe")
        .attr("stroke-width", 2.2);

    // label YA / TIDAK
    linkGroups.append("text")
        .attr("class", "branch-label")
        .attr("x", d => (d.source.y + d.target.y) / 2)
        .attr("y", d => (d.source.x + d.target.x) / 2 - 6)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("fill", "#4338ca")
        .text(d => {
            const idx = d.source.children.indexOf(d.target);
            return idx === 0 ? "YA (≤)" : "TIDAK (>)";
        });

            
}

async function fetchForecastByDate(date) {
    const lat = 0.5417;
    const lon = 123.0568;

    const url = `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${lat}&longitude=${lon}` +
        `&daily=temperature_2m_max,temperature_2m_min,windspeed_10m_max,relative_humidity_2m_max` +
        `&timezone=Asia/Jakarta`;

    const res = await fetch(url);
    const data = await res.json();

    const idx = data.daily.time.indexOf(date);
    if (idx === -1) throw new Error("Tanggal tidak tersedia");

    const tmin = data.daily.temperature_2m_min[idx];
    const tmax = data.daily.temperature_2m_max[idx];
    const wspd = data.daily.windspeed_10m_max[idx];
    const rhum = data.daily.relative_humidity_2m_max[idx];
    const tavg = (tmin + tmax) / 2;

    return { tmin, tmax, tavg, wspd, rhum };
}

async function predictFromDate() {
    const date = document.getElementById("prediction_date").value;
    if (!date) return;

    try {
        const input = await fetchForecastByDate(date);

        // // isi input tersembunyi (optional)
        // document.getElementById("tmin").value = input.tmin;
        // document.getElementById("tmax").value = input.tmax;
        // document.getElementById("tavg").value = input.tavg;
        // document.getElementById("wspd").value = input.wspd;

        const { result, path } = predictFromTree(decisionTree, input);

        updateWeatherCard(input, result);
        document.getElementById("prediksi_result").innerText = result;
        highlightPath(path);

    } catch (err) {
        document.getElementById("prediksi_result").innerText =
            "Data cuaca tidak tersedia";
        console.error(err);
    }
}


/* -------------------------
   Highlight functions
   - highlights rect + text fill for nodes on path
   - resets previous highlights
   ------------------------- */
function clearHighlights() {
    d3.selectAll("g.node rect")
        .transition().duration(150)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .style("opacity", 1);

    d3.selectAll("line.link")
        .transition().duration(150)
        .attr("stroke", "#c7d2fe")
        .attr("stroke-width", 2);
}

function registerRawNodeUid(rawNode, d3Node) {
    rawNodeToUid.set(rawNode, d3Node.__uid);
}

function getDecisionPath(root, input) {
    const pathNodes = [];
    const pathLinks = [];

    let current = root;

    while (current.children) {
        pathNodes.push(current);

        const feature = current.data.feature;
        const threshold = current.data.threshold;
        const value = input[feature];

        const goLeft = value <= threshold;
        const next = goLeft ? current.children[0] : current.children[1];

        pathLinks.push({
            source: current,
            target: next
        });

        current = next;
    }

    pathNodes.push(current); // leaf
    return { pathNodes, pathLinks };
}


function highlightPath(pathNodes) {
    if (!Array.isArray(pathNodes)) {
        console.warn("highlightPath: pathNodes bukan array", pathNodes);
        return;
    }

    // reset semua node
    d3.selectAll(".node rect")
        .attr("stroke", "none");

    // reset semua link
    d3.selectAll(".link")
        .attr("stroke", "#c7d2fe")
        .attr("stroke-width", 2.2);

    // highlight node
    pathNodes.forEach(n => {
        const uid = rawNodeToUid.get(n);
        if (!uid) return;

        d3.select(`#node-${uid} rect`)
            .attr("stroke", "#facc15")
            .attr("stroke-width", 3);
    });

    // highlight link antar node
    for (let i = 0; i < pathNodes.length - 1; i++) {
        const srcUid = rawNodeToUid.get(pathNodes[i]);
        const tgtUid = rawNodeToUid.get(pathNodes[i + 1]);

        if (!srcUid || !tgtUid) continue;

        d3.selectAll(".link")
            .filter(d =>
                d.source.data.__uid === srcUid &&
                d.target.data.__uid === tgtUid
            )
            .attr("stroke", "#facc15")
            .attr("stroke-width", 4);
    }
}




/* -------------------------
   Prediction function (reads raw decisionTree)
   - returns { result, path } where path elements include uid
   ------------------------- */
function predictFromTree(tree, input) {
    let node = tree;
    let path = [];
    let parent = null;

    while (node.feature) {
        node.parent = parent;
        path.push(node);

        let feature = node.feature;
        let threshold = node.threshold;

        parent = node;

        if (input[feature] <= threshold) node = node.left;
        else node = node.right;

        if (!node) break;
    }

    if (node) {
        node.parent = parent;
        path.push(node);
    }

    return {
        result: node?.label === 1 ? "Hujan" :
                node?.label === 0 ? "Tidak Hujan" : "Tidak tersedia",
        path
    };
}



/* -------------------------
   UI updates for weather card
   ------------------------- */
function updateWeatherCard(input, result) {
    // temperature
    const tempEl = document.getElementById("temperature");
    if (tempEl && !isNaN(input.tavg)) {
        tempEl.innerText = `${input.tavg}°C`;
    }

    // condition (tmin + wind)
    const condEl = document.getElementById("card_condition");
    if (condEl) {
        condEl.innerText = `min ${input.tmin}°C • wind ${input.wspd} km/h`;
    }

    // humidity

    const humEl = document.getElementById("card_humidity");
    if (humEl && !isNaN(input.rhum)) {
        humEl.innerText = `${input.rhum}%`;
    }

    // wind
    const windEl = document.getElementById("card_windSpeed");
    if (windEl) {
        windEl.innerText = `${input.wspd} km/h`;
    }

    // visibility
    const vis = parseFloat(document.getElementById("visibility")?.value);
    const visEl = document.getElementById("card_visibility");
    if (visEl && !isNaN(vis)) {
        visEl.innerText = `${vis} km`;
    }

    // pressure
    const pres = parseFloat(document.getElementById("pressure")?.value);
    const presEl = document.getElementById("card_pressure");
    if (presEl && !isNaN(pres)) {
        presEl.innerText = `${pres} hPa`;
    }

    // prediction
    const predEl = document.getElementById("prediksi_result");
    if (predEl) predEl.innerText = result;
}


/* -------------------------
   Load tree.json and initialize everything
   ------------------------- */
async function loadDecisionTree() {
    try {
        const res = await fetch("/data/tree.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawTree = await res.json();

        if (!rawTree || Object.keys(rawTree).length === 0) {
            console.error("tree.json kosong atau tidak valid");
            return;
        }

        // store raw tree for prediction
        decisionTree = rawTree;

        // reset mapping and uid counter before conversion
        rawNodeToUid = new Map();
        uidCounter = 0;

        // convert and populate mapping
        const d3Tree = convertToD3Format(rawTree);

        // finally draw
        drawTree(d3Tree);

        // keep raw tree globally accessible
        window.treeData = decisionTree;

        // run initial prediction from input fields (if present)
        runPrediction();
    } catch (err) {
        console.error("Gagal load tree.json:", err);
        // show message in svg
        d3.select("#treeCanvas").html("");
        d3.select("#treeCanvas")
            .append("text")
            .attr("x", 10)
            .attr("y", 20)
            .attr("fill", "#333")
            .text("Gagal memuat decision tree (periksa /data/tree.json)");
    }
}

/* -------------------------
   Read inputs, predict, update UI + highlight
   ------------------------- */
function getInputFromForm() {
    const tavg = parseFloat(document.getElementById("tavg")?.value);
    const tmin = parseFloat(document.getElementById("tmin")?.value);
    const wspd = parseFloat(document.getElementById("wspd")?.value);
    const tmax = parseFloat(document.getElementById("tmax")?.value);

    return {
        tavg: isNaN(tavg) ? null : tavg,
        tmin: isNaN(tmin) ? null : tmin,
        wspd: isNaN(wspd) ? null : wspd,
        tmax: isNaN(tmax) ? null : tmax
    };
}

function runPrediction() {
    if (!decisionTree) {
        console.warn("Decision tree belum siap");
        return;
    }

    // Ambil input form
    const tavg = parseFloat(document.getElementById("tavg")?.value);
    const tmax = parseFloat(document.getElementById("tmax")?.value);
    const tmin = parseFloat(document.getElementById("tmin")?.value);
    const wspd = parseFloat(document.getElementById("wspd")?.value);

    // Cek input valid
    if ([tavg, tmax, tmin, wspd].some(v => isNaN(v))) {
        document.getElementById("prediksi_result").innerText =
            "Isi semua data cuaca";
        return;
    }

    const input = getInputFromForm();


    const { result, path } = predictFromTree(decisionTree, input);

    document.getElementById("prediksi_result").innerText = 
        result ?? "Tidak ada hasil";
    updateWeatherCard(input, result);
    // highlight node pada D3
    highlightPath(path);
}


/* -------------------------
   Wire up UI events
   ------------------------- */
function attachUiListeners() {
    // auto predict on input
    ["tavg", "tmin", "wspd", "tmax"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", () => {
            // debounce small delay (optional) - keep instant for now
            runPrediction();
        });
    });

    const btn = document.getElementById("predictBtn");
    if (btn) btn.addEventListener("click", (e) => {
        e.preventDefault();
        runPrediction();
    });
}
document.getElementById("prediction_date")
    ?.addEventListener("change", predictFromDate);

/* -------------------------
   Init
   ------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    // remove any legacy or injected Cloudflare blocks if present (just in case)
    // (we won't try to re-add them)
    console.log("DOM loaded, attaching listeners...");
    attachUiListeners();
    loadDecisionTree();
});
