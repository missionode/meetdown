# MeetDown

**MeetDown** is a vibrant, real-time location-based social application designed to help people connect for casual meetups, particularly over coffee. Discover users within a 250-meter radius, send "vibes," and get matched when there's mutual interest\!

-----

## 🌟 Features

  * **Proximity-Based Discovery:** See other users who are physically close to your location (within 250 meters).
  * **"Coffee Vibe" System:** Send a simple "coffee vibe" to express interest in connecting.
  * **Mutual Matching:** Get instantly notified when you and another user send a "coffee vibe" to each other.
  * **Real-time Updates:** Refresh the user list to see new users and updated match statuses.
  * **Profile Management:** Create your profile with your name, location, and a profile picture.
  * **Session Management:** Your profile persists as long as your session is active. Easily log out to remove your profile from the pool.
  * **"Mark Seen" for Matches:** Keep your list tidy by marking mutual matches as "seen," moving them to the bottom of your list.

-----

## 🚀 Technologies Used

  * **Frontend:**
      * HTML5
      * CSS3
      * JavaScript (ES6+)
      * Material Icons (for a clean UI)
  * **Backend:**
      * PHP 7.4+ (or newer)
  * **Database:**
      * MySQL / MariaDB
  * **Server:**
      * Apache (or Nginx)

-----

## 🛠️ Setup Instructions

Follow these steps to get MeetDown up and running on your local machine.

### 1\. Prerequisites

Before you begin, ensure you have the following installed:

  * **Web Server:** Apache or Nginx (e.g., via XAMPP, WAMP, MAMP, or a standalone installation).
  * **PHP:** PHP 7.4 or newer.
  * **MySQL/MariaDB:** Database server.

### 2\. Database Setup

1.  **Create Database:**
    Open your MySQL client (e.g., phpMyAdmin, MySQL Workbench) and create a new database named `meetdown`.

    ```sql
    CREATE DATABASE meetdown;
    USE meetdown;
    ```

2.  **Create Tables:**
    Execute the following SQL queries to create the necessary tables:

    ```sql
    CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        profile_img VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE vibe_interactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_user_id INT NOT NULL,
        to_user_id INT NOT NULL,
        vibe_type ENUM('coffee') NOT NULL, -- Only 'coffee' is supported
        seen_by_from_user BOOLEAN DEFAULT FALSE, -- To mark if the 'from_user' has seen the match
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_vibe (from_user_id, to_user_id, vibe_type) -- Prevents duplicate vibes of the same type
    );
    ```

### 3\. Project Files

1.  **Clone/Download:**
    Download or clone the MeetDown project files to your web server's document root (e.g., `htdocs` for XAMPP, `www` for WAMP). Name the folder `meetdown`.
    Your project structure should look something like this:

    ```
    meetdown/
    ├── api/
    │   ├── create_profile.php
    │   ├── get_users.php
    │   ├── logout.php
    │   ├── mark_seen.php
    │   └── send_vibe.php
    ├── assets/
    │   ├── css/
    │   │   └── global.css
    │   └── js/
    │       └── global.js
    ├── includes/
    │   ├── db_connect.php
    │   └── functions.php (can be empty, but required)
    ├── pages/
    │   ├── enter-pool/
    │   │   └── index.html
    │   └── user-list/
    │       ├── index.html
    │       └── user-list.css
    │       └── user-list.js
    └── uploads/ (empty, for profile images)
    ```

2.  **Configure Database Connection:**
    Open `meetdown/includes/db_connect.php` and update the database credentials to match your MySQL setup:

    ```php
    <?php
    $host = 'localhost'; // Your database host
    $db = 'meetdown';    // Your database name
    $user = 'root';      // Your database username
    $pass = '';          // Your database password

    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
    } catch (\PDOException $e) {
        throw new \PDOException($e->getMessage(), (int)$e->getCode());
    }
    ?>
    ```

3.  **Ensure `uploads` folder exists and is writable:**
    Make sure there's an `uploads` folder directly inside your `meetdown` project root. This folder needs write permissions for your web server so it can save profile images.

### 4\. Run the Application

1.  **Start your web server and MySQL server.**
2.  Open your web browser and navigate to:
    `http://localhost/meetdown/pages/enter-pool/index.html`

You should now be able to create a profile and start interacting with MeetDown\!

-----

## 🏃 How to Use

1.  **Create Your Profile:** Enter your name, upload a profile picture, and allow location access. This will place you in the "pool."
2.  **Discover Users:** Once your profile is created, you'll see a list of other users within 250 meters.
3.  **Send a Vibe:** Click the "Send Vibe" button on a user's card to express your interest. The button will change to "Vibe Sent\!"
4.  **Mutual Match:** If that user also sends a "coffee vibe" back to you, it's a match\! A coffee cup icon will appear on their card, and you'll get a notification.
5.  **Mark Seen:** For matched users, you can click "Mark Seen" to move them to the bottom of your list (after refreshing), helping you focus on new connections.
6.  **Refresh:** Use the refresh button in the header to update the list of nearby users and their match statuses.
7.  **Logout:** When you log out, your profile (and associated vibes) will be removed from the system.

-----

## ⚠️ Important Notes

  * **Location Access:** The app requires browser location access to function. If prompted, please allow it.
  * **Testing Multiple Users:** To simulate multiple users, use different browsers (e.g., Chrome, Firefox, Edge) or Incognito/Private Browse windows. Each browser/private window maintains its own independent session.
  * **Development Reset:** For development, you can clear all user and vibe data by manually truncating the `users` and `vibe_interactions` tables in your database. An automated script (`meetdown/scripts/clear_data.php`) is also provided for daily resets via cron jobs/scheduled tasks (see "Automated Clearing" in project notes). **Do not use this automated reset in a production environment.**

-----

## 🤝 Contributing

Feel free to fork the repository, open issues, or submit pull requests.

-----

## 📄 License

This project is open-source and available under the [MIT License](https://opensource.org/licenses/MIT).

-----