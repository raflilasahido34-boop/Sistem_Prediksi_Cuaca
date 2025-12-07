<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gorontalo Weather App</title>
    <link rel="stylesheet" href="<?= base_url('/css/styles.css') ?>">
    <script src="https://cdn.tailwindcss.com" type="text/javascript"></script>

</head>

<body>
    <div class="app-container">
        <header class="header">
            <h1 class="app-title" id="appTitle">Gorontalo Weather</h1>
            <div class="location"><span>📍</span> <span id="locationName">Gorontalo, Indonesia</span>
            </div>
        </header>
        <main class="main-content">
            <div class="weather-card current-weather">
                <div class="weather-main">
                    <div class="weather-icon">
                        ⛅
                    </div>
                    <div class="temperature" id="temperature">
                        28°C
                    </div>
                    <div class="condition" id="weatherCondition">
                        Partly Cloudy
                    </div>
                </div>
                <div class="weather-details">
                    <div class="detail-item"><span class="detail-label">Humidity</span> <span class="detail-value" id="humidity">75%</span>
                    </div>
                    <div class="detail-item"><span class="detail-label">Wind Speed</span> <span class="detail-value" id="windSpeed">12 km/h</span>
                    </div>
                    <div class="detail-item"><span class="detail-label">Pressure</span> <span class="detail-value">1013 hPa</span>
                    </div>
                    <div class="detail-item"><span class="detail-label">Visibility</span> <span class="detail-value">10 km</span>
                    </div>
                </div>
            </div>
            <div class="weather-card prediction-panel">
                <h2 class="panel-title" id="predictionTitle">Weather Prediction (C4.5 Algorithm)</h2>
                <div class="decision-tree">
                    <div class="tree-container">
                        <div class="tree-node root">
                            Humidity &gt; 70%?
                        </div>
                        <div class="tree-level">
                            <div class="tree-branch">
                                <div class="branch-line"></div>
                                <div class="branch-label">
                                    Yes
                                </div>
                                <div class="tree-node">
                                    Temp &gt; 25°C?
                                </div>
                                <div class="branch-line"></div>
                                <div style="display: flex; gap: 1rem;">
                                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                                        <div class="branch-label">
                                            Yes
                                        </div>
                                        <div class="tree-node leaf-node">
                                            Rainy
                                        </div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                                        <div class="branch-label">
                                            No
                                        </div>
                                        <div class="tree-node leaf-node">
                                            Cloudy
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="tree-branch">
                                <div class="branch-line"></div>
                                <div class="branch-label">
                                    No
                                </div>
                                <div class="tree-node">
                                    Wind &gt; 15 km/h?
                                </div>
                                <div class="branch-line"></div>
                                <div style="display: flex; gap: 1rem;">
                                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                                        <div class="branch-label">
                                            Yes
                                        </div>
                                        <div class="tree-node leaf-node">
                                            Windy
                                        </div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                                        <div class="branch-label">
                                            No
                                        </div>
                                        <div class="tree-node leaf-node">
                                            Sunny
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="prediction-result">
                    <div class="result-title">
                        24-Hour Prediction
                    </div>
                    <div class="result-value">
                        ⛈️ Rainy
                    </div>
                </div>
            </div>
        </main>
        <footer class="footer">
            <p id="footerText">Data updated every 30 minutes • Powered by C4.5 Decision Tree Algorithm</p>
        </footer>
    </div>
    <script src="<?= base_url('/js/scripts.js') ?>"></script>
</body>

</html>