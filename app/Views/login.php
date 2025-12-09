<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gorontalo Weather App</title>
    <link rel="stylesheet" href="<?= base_url('/css/styles.css') ?>" />
    <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-300 min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
        <!-- Header -->
        <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-white mb-2">Weather App</h1>
            <p class="text-blue-100">Gorontalo Weather Forecast</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <!-- Decorative Top -->
            <div class="h-2 bg-gradient-to-r from-blue-500 to-cyan-400"></div>

            <div class="p-8">
                <!-- Error Message -->
                <?php if (session()->getFlashdata('error')): ?>
                    <div class="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                        <?= session()->getFlashdata('error') ?>
                    </div>
                <?php endif; ?>

                <!-- Form -->
                <form action="<?= base_url('login'); ?>" method="post" class="space-y-5">
                    <?= csrf_field() ?>

                    <div>
                        <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input type="email" id="email" name="email" required
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
                            placeholder="you@example.com">
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <input type="password" id="password" name="password" required
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
                            placeholder="••••••••">
                    </div>

                    <button type="submit" class="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition duration-200">
                        Sign In
                    </button>
                    <div class="text-center">
                        <p class="text-sm text-gray-600">Don't have an account? <a href="<?= base_url('register'); ?>" class="text-blue-500 hover:underline">Register here</a></p>
                    </div>
                </form>
            </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-white text-sm mt-6">© 2024 Gorontalo Weather App</p>
    </div>

    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="<?= base_url('/js/script.js') ?>" defer></script>
</body>

</html>