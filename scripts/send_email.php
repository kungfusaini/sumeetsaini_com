<?php

$config_path = '/path/to/secure/config.php'; 

if (file_exists($config_path)) {
    include($config_path);
} else {
    error_log("Contact form config file missing at: " . $config_path);
    header('Location: error.html'); 
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $name = filter_var(trim($_POST['name']), FILTER_SANITIZE_STRING);
    $email = filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL);
    $message = filter_var(trim($_POST['message']), FILTER_SANITIZE_STRING);

    if (empty($name) || !filter_var($email, FILTER_VALIDATE_EMAIL) || empty($message)) {
        header('Location: index.html?error=validation');
        exit;
    }

    $to = RECEIVING_EMAIL;
    $subject = "New Contact Form Submission from " . $name;
    
    $body = "Name: " . $name . "\n";
    $body .= "Email: " . $email . "\n\n";
    $body .= "Message:\n" . $message . "\n";

    $headers = "From: " . SENDING_EMAIL . "\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";

    $success = mail($to, $subject, $body, $headers);

    if ($success) {
        header('Location: thank_you.html'); 
    } else {
        header('Location: error.html');
    }
    exit;

} else {
    header('Location: index.html');
    exit;
}

?>
