<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');
$routes->get('weather/gorontalo', 'Weather::getGorontaloWeather');
$routes->get('login', 'Auth::login');
$routes->post('login', 'Auth::processLogin');
$routes->get('logout', 'Auth::logout');
$routes->get('register', 'Auth::register');
$routes->post('register', 'Auth::processRegister');
