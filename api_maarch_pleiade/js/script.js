

(function (Drupal, once, drupalSettings) {
  "use strict";

  Drupal.behaviors.MaarchUnifiedBehavior = {
    attach: function (context) {
      const container = document.getElementById("maarch_div_id");
      if (!container) return;

      once("MaarchUnifiedBehavior", container, context).forEach((el) => {
        const maarchUrl = drupalSettings.api_maarch_pleiade?.maarch_url;
        console.log("Maarch URL:", maarchUrl);
        if (!maarchUrl) return;



function getBasketsWithXHR() {
  const url = 'https://courrier-test.sitiv.fr/rest/home';
  const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NTM3OTQ5MjgsImV4cCI6MTc4NTI3NjAwMCwic3ViIjp7ImlkIjoyMzIsImZpcnN0bmFtZSI6InNlcnZpY2UiLCJsYXN0bmFtZSI6IndlYiIsInN0YXR1cyI6Ik9LIiwibG9naW4iOiJ3ZWJzZXJ2aWNlIn19.T0g9yq7Jh13tePBGVzJb7umQek-av5B9QXFhowEChbk';

  // 1. Créer une nouvelle instance de l'objet XMLHttpRequest
  const xhr = new XMLHttpRequest();

  // 2. Configurer la requête : méthode GET, URL, et mode asynchrone (true)
  xhr.open('GET', url, true);

  // 3. Définir les en-têtes de la requête (après .open())
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  xhr.setRequestHeader('Content-Type', 'application/json');

  // 4. Définir ce qui se passe quand la requête se termine avec succès
  xhr.onload = function() {
    // On vérifie que le statut HTTP est un succès (par ex. 200 OK)
    if (xhr.status >= 200 && xhr.status < 300) {
      // On parse la réponse texte en JSON
      try {
        const data = JSON.parse(xhr.responseText);
        console.log(data);
        // Ici, vous pourriez retourner les données via une callback ou une promesse
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
    } else {
      // Gérer les erreurs HTTP (par ex. 404, 500)
      console.error(`HTTP error! status: ${xhr.status} ${xhr.statusText}`);
    }
  };

  // 5. Gérer les erreurs réseau (ex: serveur inaccessible)
  xhr.onerror = function() {
    console.error('There was a problem with the XHR operation (network error).');
  };

  // 6. Envoyer la requête. Pour un GET, le corps est null.
  xhr.send();
}

// Appeler la fonction
getBasketsWithXHR();




        class EmailWidget {
          constructor() {
            this.currentView = 'folders';
            this.currentFolder = null;
            this.folders = [];
            this.emails = {};

            this.initializeElements();
            this.bindEvents();
            this.initialize();
          }

          /**
           * Initialize DOM elements
           */
          initializeElements() {
            this.folderView = document.getElementById('folderView');
            this.emailView = document.getElementById('emailView');
            this.loadingState = document.getElementById('loadingState');
            this.errorState = document.getElementById('errorState');

            this.folderList = document.getElementById('folderList');
            this.emailList = document.getElementById('emailList');
            this.currentFolderName = document.getElementById('currentFolderName');

            this.backBtn = document.getElementById('backBtn');
            this.retryBtn = document.getElementById('retryBtn');

            this.emptyFolders = document.getElementById('emptyFolders');
            this.emptyEmails = document.getElementById('emptyEmails');
            this.errorMessage = document.getElementById('errorMessage');
          }

          /**
           * Bind event handlers
           */
          bindEvents() {
            this.backBtn.addEventListener('click', () => this.showFolderView());
            this.retryBtn.addEventListener('click', () => this.initialize());
          }

          /**
           * Initialize the widget
           */
          async initialize() {
            this.showLoading();

            try {
              await this.loadFolders();
              this.showFolderView();
            } catch (error) {
              this.showError('Failed to load email folders. Please check your connection and try again.');
              console.error('Email widget initialization error:', error);
            }
          }

          /**
           * Load email folders from API or service
           */
          async loadFolders() {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Sample data for testing the widget functionality
            this.folders = [
              {
                id: '1',
                name: 'Inbox',
                type: 'inbox',
                description: 'New messages',
                unreadCount: 12
              },
              {
                id: '2',
                name: 'Sent',
                type: 'sent',
                description: 'Sent messages',
                unreadCount: 0
              },
              {
                id: '3',
                name: 'Drafts',
                type: 'drafts',
                description: 'Draft messages',
                unreadCount: 3
              },
              {
                id: '4',
                name: 'Spam',
                type: 'spam',
                description: 'Junk email',
                unreadCount: 27
              },
              {
                id: '5',
                name: 'Trash',
                type: 'trash',
                description: 'Deleted messages',
                unreadCount: 0
              },
              {
                id: '6',
                name: 'Work',
                type: 'folder',
                description: 'Work related emails',
                unreadCount: 5
              }
            ];

            this.renderFolders();
          }

          /**
           * Load emails for a specific folder
           */
          async loadEmails(folderId) {
            this.showLoading();

            try {
              // Simulate API delay
              await new Promise(resolve => setTimeout(resolve, 800));

              // Sample email data for testing
              const sampleEmails = {
                '1': [ // Inbox
                  {
                    id: 'e1',
                    sender: 'John Smith',
                    subject: 'Project Update - Q3 Review',
                    preview: 'Hi team, I wanted to share the latest updates on our Q3 projects. The development timeline has been...',
                    date: new Date().toISOString()
                  },
                  {
                    id: 'e2',
                    sender: 'Sarah Johnson',
                    subject: 'Meeting Tomorrow at 2 PM',
                    preview: 'Don\'t forget about our scheduled meeting tomorrow. We\'ll be discussing the new feature requirements...',
                    date: new Date(Date.now() - 86400000).toISOString() // Yesterday
                  },
                  {
                    id: 'e3',
                    sender: 'Marketing Team',
                    subject: 'New Product Launch Campaign',
                    preview: 'We\'re excited to announce the launch of our new marketing campaign. The creative assets are ready...',
                    date: new Date(Date.now() - 172800000).toISOString() // 2 days ago
                  },
                  {
                    id: 'e4',
                    sender: 'David Wilson',
                    subject: 'Code Review Request',
                    preview: 'I\'ve submitted a new pull request for the authentication module. Could you please review when you have time?',
                    date: new Date(Date.now() - 259200000).toISOString() // 3 days ago
                  }
                ],
                '2': [ // Sent
                  {
                    id: 'e5',
                    sender: 'You',
                    subject: 'Re: Budget Approval',
                    preview: 'Thanks for the quick approval. I\'ll proceed with the vendor selection process and keep you updated...',
                    date: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
                  },
                  {
                    id: 'e6',
                    sender: 'You',
                    subject: 'Weekly Status Report',
                    preview: 'Here\'s the weekly status report for all ongoing projects. Overall progress is on track...',
                    date: new Date(Date.now() - 604800000).toISOString() // 1 week ago
                  }
                ],
                '3': [ // Drafts
                  {
                    id: 'e7',
                    sender: 'Draft',
                    subject: 'Welcome Email Template',
                    preview: 'Welcome to our platform! We\'re excited to have you join our community of...',
                    date: new Date(Date.now() - 86400000).toISOString()
                  },
                  {
                    id: 'e8',
                    sender: 'Draft',
                    subject: 'Quarterly Newsletter',
                    preview: 'This quarter has been amazing with lots of new features and improvements...',
                    date: new Date(Date.now() - 432000000).toISOString() // 5 days ago
                  }
                ],
                '4': [ // Spam
                  {
                    id: 'e9',
                    sender: 'Special Offers',
                    subject: 'URGENT: Limited Time Offer!',
                    preview: 'Don\'t miss out on this amazing deal! Click now to save 90% on everything...',
                    date: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
                  }
                ],
                '5': [], // Trash (empty)
                '6': [ // Work
                  {
                    id: 'e10',
                    sender: 'HR Department',
                    subject: 'Employee Handbook Update',
                    preview: 'We\'ve updated our employee handbook with new policies. Please review the changes...',
                    date: new Date(Date.now() - 518400000).toISOString() // 6 days ago
                  }
                ]
              };

              this.emails[folderId] = sampleEmails[folderId] || [];

              this.renderEmails(folderId);
              this.showEmailView();
            } catch (error) {
              this.showError('Failed to load emails. Please try again.');
              console.error('Email loading error:', error);
            }
          }

          /**
           * Render folders in the UI
           */
          renderFolders() {
            if (this.folders.length === 0) {
              this.folderList.innerHTML = this.emptyFolders.outerHTML;
              return;
            }

            this.folderList.innerHTML = this.folders.map(folder => `
            <div class="folder-item" data-folder-id="${folder.id}">
                <div class="folder-info">
                    <div class="folder-icon">
                       <i class="fa fa-solid fa-envelope-open-text"></i>
                    </div>
                    <div class="folder-details">
                        <h4>${this.escapeHtml(folder.name)}</h4>
                        <p>${folder.description || 'Email folder'}</p>
                    </div>
                </div>
                <div class="notification-badge ${folder.unreadCount === 0 ? 'zero' : ''}">
                    ${folder.unreadCount}
                </div>
            </div>
        `).join('');

            // Add click handlers to folder items
            this.folderList.querySelectorAll('.folder-item').forEach(item => {
              item.addEventListener('click', () => {
                const folderId = item.dataset.folderId;
                const folder = this.folders.find(f => f.id === folderId);
                this.openFolder(folder);
              });
            });

            // Update feather icons
            //   feather.replace();
          }

          /**
           * Render emails for the current folder
           */
          renderEmails(folderId) {
            const emails = this.emails[folderId] || [];

            if (emails.length === 0) {
              this.emailList.innerHTML = this.emptyEmails.outerHTML;
              return;
            }

            this.emailList.innerHTML = emails.map(email => `
            <div class="email-item" data-email-id="${email.id}">
                <div class="email-sender">${this.escapeHtml(email.sender)}</div>
                <div class="email-subject">${this.escapeHtml(email.subject)}</div>
                <div class="email-preview">${this.escapeHtml(email.preview)}</div>
                <div class="email-date">${this.formatDate(email.date)}</div>
            </div>
        `).join('');

            // Add click handlers to email items
            this.emailList.querySelectorAll('.email-item').forEach(item => {
              item.addEventListener('click', () => {
                const emailId = item.dataset.emailId;
                this.openEmail(emailId);
              });
            });
          }

          /**
           * Open a folder and show its emails
           */
          openFolder(folder) {
            this.currentFolder = folder;
            this.currentFolderName.textContent = folder.name;
            this.loadEmails(folder.id);
          }

          /**
           * Open an individual email (placeholder for future implementation)
           */
          openEmail(emailId) {
            console.log('Opening email:', emailId);
            // In a real implementation, this would open email details
            // Could navigate to email detail view or open in modal
          }

          /**
           * Show folder view
           */
          showFolderView() {
            this.hideAllViews();
            this.folderView.classList.remove('hidden');
            this.currentView = 'folders';
          }

          /**
           * Show email list view
           */
          showEmailView() {
            this.hideAllViews();
            this.emailView.classList.remove('hidden');
            this.currentView = 'emails';
          }

          /**
           * Show loading state
           */
          showLoading() {
            this.hideAllViews();
            this.loadingState.classList.remove('hidden');
          }

          /**
           * Show error state
           */
          showError(message) {
            this.hideAllViews();
            this.errorMessage.textContent = message;
            this.errorState.classList.remove('hidden');
          }

          /**
           * Hide all views
           */
          hideAllViews() {
            this.folderView.classList.add('hidden');
            this.emailView.classList.add('hidden');
            this.loadingState.classList.add('hidden');
            this.errorState.classList.add('hidden');
          }

          /**
           * Refresh the current view
           */
          async refresh() {
            if (this.currentView === 'folders') {
              await this.loadFolders();
            } else if (this.currentView === 'emails' && this.currentFolder) {
              await this.loadEmails(this.currentFolder.id);
            }
          }

          /**
           * Get appropriate icon for folder type
           */
          getFolderIcon(type) {
            const icons = {
              inbox: 'inbox',
              sent: 'send',
              drafts: 'edit-3',
              trash: 'trash-2',
              spam: 'shield',
              archive: 'archive'
            };
            return icons[type] || 'folder';
          }

          /**
           * Format date for display
           */
          formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              return 'Today';
            } else if (diffDays === 2) {
              return 'Yesterday';
            } else if (diffDays <= 7) {
              return `${diffDays - 1} days ago`;
            } else {
              return date.toLocaleDateString();
            }
          }

          /**
           * Escape HTML to prevent XSS attacks
           */
          escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
          }
        }

        // Initialize the email widget when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
          new EmailWidget();
        });

        // Export for potential module usage
        if (typeof module !== 'undefined' && module.exports) {
          module.exports = EmailWidget;
        }











      });
    },
  };
})(Drupal, once, drupalSettings);