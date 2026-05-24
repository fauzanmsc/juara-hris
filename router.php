<?php
// router.php - Router for local PHP Development Server

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Serve static assets as-is if they exist physically and are NOT a directory
if ($uri !== '/' && file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
    return false;
}

// Admin Panel Main Routing
if ($uri === '/admin' || $uri === '/admin/') {
    $_SERVER['PHP_SELF'] = '/admin/dashboard.php';
    include __DIR__ . '/admin/dashboard.php';
    exit;
}

// Admin Subpages Routing
if (preg_match('#^/admin/([^/]+)/?$#', $uri, $matches)) {
    $page = $matches[1];
    if (file_exists(__DIR__ . "/admin/$page.php")) {
        $_SERVER['PHP_SELF'] = "/admin/$page.php";
        include __DIR__ . "/admin/$page.php";
        exit;
    }
}

// Employee Panel Main Routing
if ($uri === '/employee' || $uri === '/employee/' || $uri === '/employee/beranda') {
    $_SERVER['PHP_SELF'] = '/employee/beranda.php';
    include __DIR__ . '/employee/beranda.php';
    exit;
}

// Employee Subpages Routing
if (preg_match('#^/employee/([^/]+)/?$#', $uri, $matches)) {
    $page = $matches[1];
    if (file_exists(__DIR__ . "/employee/$page.php")) {
        $_SERVER['PHP_SELF'] = "/employee/$page.php";
        include __DIR__ . "/employee/$page.php";
        exit;
    }
}

// Root Pages Routing
$page = ltrim($uri, '/');
if ($page === '') {
    $_SERVER['PHP_SELF'] = '/index.php';
    include __DIR__ . '/index.php';
    exit;
}

if (file_exists(__DIR__ . "/$page.php")) {
    $_SERVER['PHP_SELF'] = "/$page.php";
    include __DIR__ . "/$page.php";
    exit;
}

// Fallback to index.php if path is not resolved
$_SERVER['PHP_SELF'] = '/index.php';
include __DIR__ . '/index.php';
exit;
