document.addEventListener('DOMContentLoaded', () => {
    const userListContainer = document.getElementById('userListContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noUsersMessage = document.getElementById('noUsersMessage');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userProfileThumb = document.getElementById('userProfileThumb');

    let currentUserId = null; // This will be set from the server response or session
    let usersData = []; // Store the fetched user data
    let sentVibes = new Set(); // Store IDs of users current user has sent vibes to

    // --- Utility Function to create user card HTML ---
    const createUserCard = (user) => {
        // Assume all images are in the uploads folder
        const profileImgPath = `../../uploads/${user.profile_img}`;
        
        let matchIconHtml = '';
        let showSeenButton = 'display: none;'; // Hidden by default

        if (user.is_matched) {
            const matchIcon = 'local_cafe'; // Always coffee cup icon for a match
            const matchClass = 'coffee-match'; // Always coffee match class
            matchIconHtml = `<div class="match-status-icon ${matchClass}"><span class="material-icons">${matchIcon}</span></div>`;
            if (!user.is_seen) { // Only show "Mark Seen" if it's a match AND not yet seen
                showSeenButton = 'display: block;';
            }
        }

        return `
            <div class="user-card" data-user-id="${user.id}" data-is-matched="${user.is_matched}" data-is-seen="${user.is_seen}">
                ${matchIconHtml}
                <div class="profile-image" data-img-src="${profileImgPath}">
                    <img src="${profileImgPath}" alt="${user.name}">
                </div>
                <h3 class="user-name">${user.name}</h3>
                <p class="distance">${user.distance} m away</p>
                <div class="user-card-actions">
                    <button class="coffee-btn" data-vibe-type="coffee">
                        <span class="material-icons">local_cafe</span> Send Vibe
                    </button>
                </div>
                <button class="seen-btn" style="${showSeenButton}">Mark Seen</button>
            </div>
        `;
    };

    // --- Function to fetch and display users ---
    const fetchUsers = async () => {
        loadingIndicator.style.display = 'block';
        userListContainer.innerHTML = ''; // Clear previous list
        noUsersMessage.style.display = 'none';
        sentVibes.clear(); // Clear previously sent vibes on refresh

        try {
            const response = await fetch('../../api/get_users.php');
            const result = await response.json();

            if (result.success) {
                currentUserId = result.current_user_id; // Set current user ID from session
                userProfileThumb.src = `../../uploads/${result.current_user_img}`; // Set user's own profile thumb

                // Populate sentVibes from backend data
                if (result.sent_vibes_to_users && Array.isArray(result.sent_vibes_to_users)) {
                    result.sent_vibes_to_users.forEach(userId => sentVibes.add(String(userId)));
                }

                if (result.users && result.users.length > 0) {
                    usersData = result.users; // Store fetched data
                    renderUsers(); // Render initial list
                } else {
                    noUsersMessage.style.display = 'flex'; // Use flex to center icon/text
                }
            } else {
                // If session not found, redirect to enter pool page
                if (result.message === 'User session not found. Please create a profile.') {
                     alert("Your session has expired or profile not found. Redirecting to profile creation.");
                     window.location.href = '../enter-pool/index.html';
                     return;
                }
                alert("Error fetching users: " + result.message);
                noUsersMessage.style.display = 'flex'; // Show message on error
                noUsersMessage.querySelector('p').textContent = result.message; // Display error message
                console.error("Error fetching users:", result.message);
            }
        } catch (error) {
            console.error("Network error fetching users:", error);
            alert("Network error. Could not connect to server.");
            noUsersMessage.style.display = 'flex'; // Show message on error
            noUsersMessage.querySelector('p').textContent = "Network error. Please try again.";
        } finally {
            loadingIndicator.style.display = 'none';
        }
    };

    // --- Function to render users based on current usersData and seen status ---
    const renderUsers = () => {
        userListContainer.innerHTML = '';
        const sortedUsers = [...usersData].sort((a, b) => {
            // Seen matches go to bottom
            const aIsMatchedAndSeen = a.is_matched && a.is_seen;
            const bIsMatchedAndSeen = b.is_matched && b.is_seen;

            if (aIsMatchedAndSeen && !bIsMatchedAndSeen) return 1; // a is seen, b is not, so a goes after b
            if (!aIsMatchedAndSeen && bIsMatchedAndSeen) return -1; // b is seen, a is not, so a goes before b

            // Then sort by distance (nearest first) for non-seen/non-matched and unseen matches
            return a.distance - b.distance;
        });

        sortedUsers.forEach(user => {
            userListContainer.insertAdjacentHTML('beforeend', createUserCard(user));
        });
        attachEventListenersToCards(); // Re-attach listeners after re-rendering
    };


    // --- Attach event listeners to dynamically created cards ---
    const attachEventListenersToCards = () => {
        document.querySelectorAll('.user-card').forEach(card => {
            const sendVibeButton = card.querySelector('.coffee-btn'); // Get the send vibe button
            const toUserId = card.dataset.userId;

            // Set initial state of the send vibe button
            if (sendVibeButton) {
                if (sentVibes.has(toUserId)) {
                    sendVibeButton.disabled = true;
                    sendVibeButton.textContent = 'Vibe Sent!';
                    sendVibeButton.classList.add('vibe-sent-state'); // Add class for styling
                } else {
                    sendVibeButton.disabled = false;
                    sendVibeButton.textContent = 'Send Vibe';
                    sendVibeButton.classList.remove('vibe-sent-state');
                }

                // Attach click listener only if not already sent (or enable/disable it dynamically)
                // We always attach, but button's `disabled` state controls clicks
                sendVibeButton.onclick = async (event) => {
                    if (sendVibeButton.disabled) return; // Prevent action if already disabled
                    const vibeType = sendVibeButton.dataset.vibeType; // Will always be 'coffee'
                    await sendVibe(toUserId, vibeType, card);
                };
            }

            // Mark Seen Button
            const seenBtn = card.querySelector('.seen-btn');
            if (seenBtn) {
                seenBtn.onclick = async () => {
                    const toUserId = card.dataset.userId;
                    await markUserSeen(toUserId, card);
                };
            }

            // Profile Image Click for larger view
            const profileImage = card.querySelector('.profile-image');
            profileImage.onclick = (event) => {
                // Prevent clicking the image from also triggering a vibe if buttons overlap
                event.stopPropagation(); 
                const imgSrc = profileImage.dataset.imgSrc;
                showImageOverlay(imgSrc);
            };
        });
    };

    // --- Send Vibe Function ---
    const sendVibe = async (toUserId, vibeType, cardElement) => {
        const sendVibeButton = cardElement.querySelector('.coffee-btn');
        sendVibeButton.disabled = true;
        sendVibeButton.textContent = 'Sending...';
        sendVibeButton.classList.remove('vibe-sent-state'); // Ensure it's not set if retrying

        try {
            const response = await fetch('../../api/send_vibe.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to_user_id: toUserId, vibe_type: vibeType }) // vibeType will be 'coffee'
            });

            const result = await response.json();

            if (result.success) {
                if (result.is_match) {
                    alert(`It's a MATCH with ${cardElement.querySelector('.user-name').textContent}!`);
                    const matchIcon = 'local_cafe'; // Always coffee cup icon
                    const matchClass = 'coffee-match'; // Always coffee match class
                    const matchIconHtml = `<div class="match-status-icon ${matchClass}"><span class="material-icons">${matchIcon}</span></div>`;
                    cardElement.insertAdjacentHTML('afterbegin', matchIconHtml);
                    cardElement.dataset.isMatched = 'true'; // Update data attribute
                    cardElement.querySelector('.seen-btn').style.display = 'block'; // Show seen button
                    
                    // Update internal data model
                    const userIndex = usersData.findIndex(u => u.id == toUserId);
                    if (userIndex !== -1) {
                        usersData[userIndex].is_matched = true;
                        usersData[userIndex].match_type = 'coffee'; // Always coffee for matches
                        usersData[userIndex].is_seen = false; // New matches are initially unseen by this user
                    }
                } else if (result.message === 'You have already sent a vibe to this user.') {
                    // Already sent, no new action needed, just update button state
                    // No alert here, as it's handled by setting button state.
                } else {
                    // Vibe sent successfully, not a match yet
                    alert(`You sent a vibe to ${cardElement.querySelector('.user-name').textContent}!`);
                }

                // Always mark as sent if success, whether it was new or duplicate
                sentVibes.add(String(toUserId)); // Add to set
                sendVibeButton.disabled = true;
                sendVibeButton.textContent = 'Vibe Sent!';
                sendVibeButton.classList.add('vibe-sent-state'); // Add class for styling

            } else {
                alert("Error sending vibe: " + result.message);
                console.error("Vibe send error:", result.message);
                sendVibeButton.disabled = false; // Re-enable on failure
                sendVibeButton.textContent = 'Send Vibe';
                sendVibeButton.classList.remove('vibe-sent-state');
            }
        } catch (error) {
            console.error("Network error sending vibe:", error);
            alert("Network error. Could not send vibe.");
            sendVibeButton.disabled = false; // Re-enable on network error
            sendVibeButton.textContent = 'Send Vibe';
            sendVibeButton.classList.remove('vibe-sent-state');
        }
    };

    // --- Mark User Seen Function ---
    const markUserSeen = async (toUserId, cardElement) => {
        const seenBtn = cardElement.querySelector('.seen-btn');
        if (seenBtn) {
            seenBtn.disabled = true; // Disable seen button
        }

        try {
            const response = await fetch('../../api/mark_seen.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to_user_id: toUserId })
            });

            const result = await response.json();

            if (result.success) {
                alert("Match marked as seen. This user will move to the bottom of the list on refresh.");
                cardElement.dataset.isSeen = 'true'; // Update data attribute
                if (seenBtn) {
                    seenBtn.style.display = 'none'; // Hide seen button
                }

                // Update internal data model
                const userIndex = usersData.findIndex(u => u.id == toUserId);
                if (userIndex !== -1) {
                    usersData[userIndex].is_seen = true;
                }
                renderUsers(); // Re-render to move to bottom
            } else {
                alert("Error marking seen: " + result.message);
                console.error("Mark seen error:", result.message);
            }
        } catch (error) {
            console.error("Network error marking seen:", error);
            alert("Network error. Could not mark as seen.");
        } finally {
            if (seenBtn) { // Check if button exists before re-enabling
                seenBtn.disabled = false;
            }
        }
    };

    // --- Image Overlay Functions ---
    const showImageOverlay = (src) => {
        let overlay = document.querySelector('.overlay');
        let imgElement = document.querySelector('.overlay img');

        // Ensure the overlay is created if it doesn't exist (though it's in HTML now)
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.classList.add('overlay');
            overlay.innerHTML = '<img src="" alt="Full size image">';
            document.body.appendChild(overlay);
            imgElement = overlay.querySelector('img');

            overlay.addEventListener('click', () => {
                overlay.classList.remove('visible');
            });
        }
        
        imgElement.src = src;
        overlay.classList.add('visible');
    };

    // --- Logout Function ---
    logoutBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to log out? Your profile will be deleted.")) {
            try {
                const response = await fetch('../../api/logout.php', {
                    method: 'POST' // Simple POST request to trigger session destruction and profile deletion
                });
                const result = await response.json();
                if (result.success) {
                    alert("Logged out successfully. Your profile has been reset.");
                    window.location.href = '../enter-pool/index.html'; // Redirect to enter pool
                } else {
                    alert("Logout failed: " + result.message);
                    console.error("Logout error:", result.message);
                }
            } catch (error) {
                console.error("Network error during logout:", error);
                alert("Network error during logout. Please try again.");
            }
        }
    });

    // --- Initial Load ---
    fetchUsers(); // Fetch users when the page loads

    // --- Refresh Button ---
    refreshBtn.addEventListener('click', fetchUsers);
});