<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gorontalo Weather App</title>
    <link rel="stylesheet" href="<?= base_url('/css/styles.css') ?>" />
    <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-gradient-to-b from-blue-100 to-blue-200 min-h-screen p-4">
    <div class="w-full max-w-7xl mx-auto px-4 bg-white shadow-2xl rounded-3xl overflow-hidden border border-blue-300">

        <!-- NAVBAR WITH LOGIN/REGISTER -->
        <nav class="flex justify-between items-center px-6 py-4 bg-blue-600 text-white shadow-md">
            <h1 class="text-2xl font-bold">Gorontalo Weather</h1>

            <!-- If user not logged in -->
            <div class="flex items-center gap-3" id="authButtons">
                <a href="<?= base_url('/login') ?>" class="px-4 py-1 bg-white text-blue-600 font-semibold rounded-lg shadow hover:bg-gray-200 transition">Login</a>
                <a href="<?= base_url('/register') ?>" class="px-4 py-1 bg-blue-800 text-white font-semibold rounded-lg shadow hover:bg-blue-900 transition">Register</a>
            </div>

            <!-- When user IS logged in -->
            <div class="hidden items-center gap-4" id="userProfile">
                <form method="get" action="<?= base_url('/logout') ?>">
                    <button class="px-4 py-1 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition">Logout</button>
                </form>
            </div>
        </nav>

        <!-- HEADER LOCATION -->
        <header class="p-6 bg-blue-600 text-white text-center shadow-md mt-2 rounded-2xl">
            <div class="flex justify-center items-center gap-2 text-lg">
                <span>📍</span>
                <span id="locationName">Gorontalo, Indonesia</span>
            </div>
        </header>

        <main class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Current Weather Card -->
            <div class="p-6 bg-blue-50 rounded-2xl shadow-md">
                <div class="flex flex-col items-center">
                    <div class="text-6xl mb-2">⛅</div>
                    <div class="text-4xl font-semibold" id="temperature">28°C</div>
                    <div class="text-lg text-gray-700" id="weatherCondition">Partly Cloudy</div>
                </div>

                <div class="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div class="p-3 bg-white rounded-xl shadow text-center">
                        <p class="font-semibold">Humidity</p>
                        <p id="card_humidity">75%</p>
                    </div>
                    <div class="p-3 bg-white rounded-xl shadow text-center">
                        <p class="font-semibold">Wind Speed</p>
                        <p id="card_windSpeed">12 km/h</p>
                    </div>
                    <div class="p-3 bg-white rounded-xl shadow text-center">
                        <p class="font-semibold">Pressure</p>
                        <p id="card_pressure">1013 hPa</p>
                    </div>
                    <div class="p-3 bg-white rounded-xl shadow text-center">
                        <p class="font-semibold">Visibility</p>
                        <p id="card_visibility">10 km</p>
                    </div>
                </div>
            </div>

            <!-- Prediction Card -->
            <div class="p-6 bg-blue-50 rounded-2xl shadow-md">
                <h2 class="text-xl font-bold text-center mb-4" id="predictionTitle">Weather Prediction (C4.5 Algorithm)</h2>

                <div class="border rounded-xl bg-white p-3 shadow">
                    <svg id="treeCanvas" width="100%" height="350"></svg>
                </div>

                <div class="mt-5 p-4 bg-white rounded-xl shadow text-center">
                    <p class="text-md font-semibold">24-Hour Prediction</p>
                    <p class="text-3xl mt-2" id="prediksi_result">⛈️ Rainy</p>
                </div>
            </div>
        </main>

        <!-- Input Form (Only for logged-in users) -->
        <section class="px-6 pb-6">
            <div class="p-6 bg-white rounded-2xl shadow grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50 pointer-events-none" id="inputFormWrapper">
                <div class="md:col-span-3 text-center mb-4 hidden" id="loginReminder">
                    <p class="bg-yellow-200 py-2 px-4 rounded-lg text-yellow-800 font-semibold shadow">Login untuk menggunakan fitur prediksi cuaca.</p>
                </div>

                <div>
                    <label class="font-semibold">Suhu Rata-Rata (tavg)</label>
                    <input id="tavg" type="number" value="27" step="0.1" class="mt-1 w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label class="font-semibold">Suhu Minimum (tmin)</label>
                    <input id="tmin" type="number" value="23" step="0.1" class="mt-1 w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label class="font-semibold">Suhu Maksimum (tmax)</label>
                    <input id="tmax" type="number" value="32" step="0.1" class="mt-1 w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label class="font-semibold">Kecepatan Angin (wspd)</label>
                    <input id="wspd" type="number" value="18" step="0.1" class="mt-1 w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label class="font-semibold">Kelembaban (rhum)</label>
                    <input id="rhum" type="number" value="75" step="0.1" class="mt-1 w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label class="font-semibold">Visibilitas (visibility)</label>
                    <input id="visibility" type="number" value="10" step="0.1" class="mt-1 w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label class="font-semibold">Tekanan (pressure)</label>
                    <input id="pressure" type="number" value="1013" step="0.1" class="mt-1 w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-400" />
                </div>

                <div class="md:col-span-3 text-center">
                    <button type="button" id="predictBtn" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow-lg transition">Prediksi</button>
                </div>
            </div>
        </section>

        <footer class="p-4 bg-blue-600 text-white text-center text-sm">
            <p id="footerText">Data updated every 30 minutes • Powered by C4.5 Decision Tree Algorithm</p>
        </footer>
    </div>

    <script>
        // Toggle UI states based on login session
        const isLoggedIn = <?= session()->get('user_id') ? 'true' : 'false' ?>;

        if (isLoggedIn) {
            document.getElementById('authButtons').classList.add('hidden');
            document.getElementById('userProfile').classList.remove('hidden');
            document.getElementById('inputFormWrapper').classList.remove('opacity-50', 'pointer-events-none');
            document.getElementById('loginReminder').classList.add('hidden');
        } else {
            document.getElementById('authButtons').classList.remove('hidden');
            document.getElementById('userProfile').classList.add('hidden');
            document.getElementById('loginReminder').classList.remove('hidden');
        }
    </script>

    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="<?= base_url('/js/script.js') ?>" defer></script>
</body>

</html>