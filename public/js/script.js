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

    const width = 900;
    const height = 450;

    // clear svg and build base group
    const svg = d3.select("#treeCanvas")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .html("")
        .append("g")
        .attr("transform", "translate(40,40)");

    const root = d3.hierarchy(data);

    const treeLayout = d3.tree().size([height - 80, width - 120]);
    treeLayout(root);

    // links (lines)
    svg.selectAll("line.link")
        .data(root.links())
        .enter()
        .append("line")
        .classed("link", true)
        .attr("x1", d => d.source.y)
        .attr("y1", d => d.source.x)
        .attr("x2", d => d.target.y)
        .attr("y2", d => d.target.x)
        .attr("stroke", "#c7d2fe")
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .attr("id", d => `link-${d.source.data.__uid}-${d.target.data.__uid}`);

    // nodes
    const nodes = svg.selectAll("g.node")
        .data(root.descendants())
        .enter()
        .append("g")
        .classed("node", true)
        .attr("transform", d => `translate(${d.y},${d.x})`);

    // give each group an id based on uid
    nodes.attr("id", d => `node-${d.data.__uid}`);

    // rect background for each node
    nodes.append("rect")
        .attr("x", -70)
        .attr("y", -22)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("width", 140)
        .attr("height", 44)
        .attr("fill", d => {
            // decision internal nodes have children in d3
            if (d.children) return "#6366f1";
            // leaf node: color by label if available
            return d.data.label === 1 ? "#16a34a" : "#dc2626";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);

    // text
    nodes.append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .each(function (d) {
            const text = d3.select(this);

            if (d.data.feature) {
                const label = featureLabelMap[d.data.feature] || d.data.feature;

                text.append("tspan")
                    .attr("x", 0)
                    .attr("dy", "-0.3em")
                    .text(label);

                // threshold may be undefined for some nodes (safety)
                if (d.data.threshold !== undefined && d.data.threshold !== null && !isNaN(d.data.threshold)) {
                    text.append("tspan")
                        .attr("x", 0)
                        .attr("dy", "1.2em")
                        .style("font-weight", "normal")
                        .text(`≤ ${Number(d.data.threshold).toFixed(2)}`);
                }
            } else {
                // leaf label
                text.text(d.data.label === 1 ? "HUJAN" : "TIDAK HUJAN");
            }
        });

    // store a reference to d3data (optional)
    d3data = data;
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
        highlightDecisionPath(path);

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

function highlightDecisionPath(path) {
    clearHighlights();

    for (let raw of path) {
        const uid = rawNodeToUid.get(raw);
        if (!uid) continue;

        // highlight node rect
        d3.select(`#node-${uid} rect`)
            .transition().duration(150)
            .attr("stroke", "#facc15")
            .attr("stroke-width", 4);

        // highlight link (if parent exists)
        if (raw.parent) {
            const pid = rawNodeToUid.get(raw.parent);
            if (pid) {
                d3.select(`#link-${pid}-${uid}`)
                    .transition().duration(150)
                    .attr("stroke", "#facc15")
                    .attr("stroke-width", 4);
            }
        }
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
    highlightDecisionPath(path);
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
