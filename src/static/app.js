document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity selector
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (rendered as a styled list)
        const participants = details.participants || [];
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants-container";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = `Participants (${participants.length})`;
        participantsContainer.appendChild(participantsTitle);

        const ul = document.createElement("ul");
        ul.className = "participants-list";

        if (participants.length === 0) {
          const li = document.createElement("li");
          li.className = "participant-item empty";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        } else {
          participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";
            
            // Create text span for participant email
            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = p;
            li.appendChild(emailSpan);

            // Create and append remove button
            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-btn";
            removeBtn.textContent = "Remove";
            removeBtn.type = "button";

            removeBtn.addEventListener("click", async () => {
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );
                if (response.ok) {
                  // Refresh the activities list to reflect change
                  fetchActivities();
                } else {
                  const err = await response.json().catch(() => null);
                  const msg = err && err.detail ? err.detail : "Failed to remove participant";
                  messageDiv.textContent = msg;
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                }
              } catch (error) {
                console.error("Error removing participant:", error);
                messageDiv.textContent = "Failed to remove participant. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              }
            });

            li.appendChild(removeBtn);
            ul.appendChild(li);
          });
        }

        participantsContainer.appendChild(ul);

        activitiesList.appendChild(activityCard);
        activityCard.appendChild(participantsContainer);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
