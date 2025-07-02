document.addEventListener('DOMContentLoaded', () => {
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImagePreview = document.getElementById('profileImagePreview');
    const userNameInput = document.getElementById('userName');
    const letsGoBtn = document.getElementById('letsGoBtn');

    let userLatitude = null;
    let userLongitude = null;

    // --- Image Preview Handler ---
    profileImageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profileImagePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            profileImagePreview.src = '../../assets/img/profile_placeholder.png'; // Reset to placeholder if no file
        }
    });

    // --- Geolocation Function ---
    const getUserLocation = () => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        userLatitude = position.coords.latitude;
                        userLongitude = position.coords.longitude;
                        console.log("Location captured:", userLatitude, userLongitude); // For debugging
                        resolve({ lat: userLatitude, lng: userLongitude });
                    },
                    (error) => {
                        let errorMessage = 'Unable to retrieve your location.';
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = "Location permission denied. Please allow location access to use this app.";
                                break;
                            case error.TIMEOUT:
                                errorMessage = "Location request timed out. Please try again.";
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = "Location information is unavailable.";
                                break;
                        }
                        console.error("Geolocation Error:", errorMessage, error);
                        alert(errorMessage);
                        letsGoBtn.disabled = false; // Re-enable button if error occurs
                        reject(new Error(errorMessage));
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000, // 10 seconds
                        maximumAge: 0 // No cached position
                    }
                );
            } else {
                alert("Geolocation is not supported by your browser. Please use a modern browser.");
                letsGoBtn.disabled = false; // Re-enable button
                reject(new Error("Geolocation not supported."));
            }
        });
    };

    // --- "Let's Go!" Button Handler ---
    letsGoBtn.addEventListener('click', async () => {
        const userName = userNameInput.value.trim();
        const profileImageFile = profileImageInput.files[0];

        if (!userName) {
            alert("Please enter your name.");
            return;
        }

        if (!profileImageFile) {
            alert("Please upload a profile picture.");
            return;
        }

        // Disable button to prevent multiple submissions
        letsGoBtn.disabled = true;
        letsGoBtn.textContent = 'Getting Location...';

        try {
            await getUserLocation(); // Wait for location to be obtained

            if (userLatitude === null || userLongitude === null) {
                // This case should ideally be caught by getUserLocation's alert, but for safety:
                alert("Could not get your location. Please ensure location services are enabled.");
                letsGoBtn.disabled = false;
                letsGoBtn.textContent = "Let's Go!";
                return;
            }

            letsGoBtn.textContent = 'Saving Profile...';

            const formData = new FormData();
            formData.append('name', userName);
            formData.append('profile_image', profileImageFile);
            formData.append('latitude', userLatitude);
            formData.append('longitude', userLongitude);

            const response = await fetch('../../api/create_profile.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Store user ID in session storage or a global JS variable if needed across pages
                // For this app's current flow, we'll just redirect and the server manages the session
                console.log("Profile created successfully! User ID:", result.user_id); // For debugging
                window.location.href = '../user-list/index.html'; // Redirect to user list page
            } else {
                alert("Error creating profile: " + result.message);
                console.error("Profile creation error:", result.message);
                letsGoBtn.disabled = false;
                letsGoBtn.textContent = "Let's Go!";
            }

        } catch (error) {
            console.error("Error during profile creation process:", error);
            alert("An error occurred. Please try again. " + error.message);
            letsGoBtn.disabled = false;
            letsGoBtn.textContent = "Let's Go!";
        }
    });
});