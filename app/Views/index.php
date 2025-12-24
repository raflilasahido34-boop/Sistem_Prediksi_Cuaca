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

        <main class="snap-y snap-mandatory overflow-y-auto h-screen">

            <!-- Weather Card FULL SCREEN -->
            <section class="snap-start min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-blue-100 to-blue-200">
                <div class="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-8">

                    <div class="flex flex-col items-center">
                        <div class="text-7xl mb-4">⛅</div>
                        <div class="text-5xl font-bold" id="temperature">-°C</div>
                    </div>

                    <div class="mt-10 grid grid-cols-2 gap-6 text-center">
                        <div class="p-6 bg-blue-50 rounded-2xl shadow">
                            <p class="font-semibold text-lg">Wind Speed</p>
                            <p class="text-2xl mt-2" id="card_windSpeed">- km/h</p>
                        </div>
                        <div class="p-6 bg-blue-50 rounded-2xl shadow">
                            <p class="font-semibold text-lg">Humidity</p>
                            <p class="text-2xl mt-2" id="card_humidity">-%</p>
                        </div>
                    </div>

                </div>
            </section>

            <!-- Prediction Card FULL SCREEN -->
            <section class="snap-start min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-white to-blue-100">
                <div class="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-8">

                    <h2 class="text-2xl font-bold text-center mb-6">
                        Weather Prediction (C4.5 Algorithm)
                    </h2>

                    <div class="border rounded-2xl bg-gray-50 p-4 shadow-inner">
                        <svg id="treeCanvas" width="100%" height="400"></svg>
                    </div>

                    <div class="mt-8 p-6 bg-blue-50 rounded-2xl shadow text-center">
                        <p class="text-lg font-semibold">24-Hour Prediction</p>
                        <p class="text-4xl mt-3 font-bold" id="prediksi_result">⛈️ Rainy</p>
                    </div>

                </div>
            </section>

        </main>

        <!-- Input Form (Only for logged-in users) -->
        <section class="px-6 pb-6">
            <div class="p-6 bg-white rounded-2xl shadow grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50 pointer-events-none" id="inputFormWrapper">
                <div class="md:col-span-3 text-center mb-4 hidden" id="loginReminder">
                    <p class="bg-yellow-200 py-2 px-4 rounded-lg text-yellow-800 font-semibold shadow">Login untuk menggunakan fitur prediksi cuaca.</p>
                </div>

                <div>
                    <label class="font-semibold">Tanggal Prediksi</label>
                    <input type="date" id="prediction_date"
                        class="mt-1 w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-400">
                </div>
            </div>
        </section>

        <footer class="p-4 bg-blue-600 text-white text-center text-sm">
            <p id="footerText">Data updated every you chose date • Powered by C4.5 Decision Tree Algorithm</p>
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