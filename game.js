class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.startMessage = document.getElementById('startMessage');
        this.pauseButton = document.getElementById('pauseButton');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.jumpSound = document.getElementById('jumpSound');
        
        // Sound state
        this.soundEnabled = false; // Sound off by default
        this.jumpSound.volume = 0.5; // Set volume to 50%
        this.hardMode = false; // Add hard mode state
        
        // Set canvas size
        this.canvas.width = 400;
        this.canvas.height = 600;
        
        // Game constants
        this.gravity = 0.25;
        this.jumpForce = -6;
        this.pipeWidth = 60;
        this.minPipeGap = 180; // Smaller minimum gap
        this.maxPipeGap = 280; // Larger maximum gap
        this.pipeSpeed = 2;
        
        // Game state
        this.score = 0;
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.highScore = parseInt(localStorage.getItem('flappyBirdHighScore')) || 0;
        this.pipesPassed = 0; // Track number of pipes passed
        this.currentTheme = 0; // Track current background theme
        
        // Background themes
        this.backgroundThemes = [
            {
                sky: '#87CEEB', // Sky blue
                buildings: '#2C3E50', // Dark blue
                windows: '#F1C40F', // Yellow
                mountains: ['#2A2A2A', '#3A3A3A', '#4A4A4A'], // Grays
                grass: '#4CAF50', // Green
                grassBlades: '#66BB6A' // Light green
            },
            {
                sky: '#FF6B6B', // Sunset red
                buildings: '#34495E', // Darker blue
                windows: '#FFD700', // Gold
                mountains: ['#8B4513', '#A0522D', '#CD853F'], // Browns
                grass: '#228B22', // Forest green
                grassBlades: '#32CD32' // Lime green
            },
            {
                sky: '#483D8B', // Night blue
                buildings: '#1A1A1A', // Dark gray
                windows: '#FFA500', // Orange
                mountains: ['#2F4F4F', '#3D3D3D', '#4A4A4A'], // Dark grays
                grass: '#006400', // Dark green
                grassBlades: '#008000' // Green
            }
        ];
        
        // Bird properties
        this.bird = {
            x: 100,
            y: this.canvas.height / 2,
            width: 35,
            height: 25,
            velocity: 0,
            rotation: 0,
            color: '#FFD700', // Default yellow color
            rainbowHue: 0 // For rainbow effect
        };
        
        // Add flag for initial pipes
        this.initialPipesCreated = false;
        
        // Pipes array
        this.pipes = [];
        
        // Event listeners
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.addEventListener('touchstart', this.handleTouch.bind(this));
        this.pauseButton.addEventListener('click', this.togglePause.bind(this));
        
        // Add window focus/blur event listeners
        window.addEventListener('blur', () => {
            if (this.gameStarted && !this.gameOver && !this.isPaused) {
                this.togglePause();
            }
        });

        // Add color tab event listeners
        this.setupColorTabs();

        // Add pause menu event listeners
        this.setupPauseMenu();
        
        // Add inspirational quotes array
        this.inspirationalQuotes = [
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "The only way to do great work is to love what you do.",
            "Believe you can and you're halfway there.",
            "It's not whether you get knocked down, it's whether you get up.",
            "The future belongs to those who believe in the beauty of their dreams.",
            "Don't watch the clock; do what it does. Keep going.",
            "The best way to predict the future is to create it.",
            "Your time is limited, don't waste it living someone else's life.",
            "The journey of a thousand miles begins with one step.",
            "Everything you can imagine is real.",
            "The only limit to our realization of tomorrow will be our doubts of today.",
            "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
            "The harder you work, the luckier you get.",
            "Don't be afraid to give up the good to go for the great.",
            "Success is walking from failure to failure with no loss of enthusiasm."
        ];
        
        // Load unlocked skins from localStorage
        this.loadUnlockedSkins();
        
        // Initialize game immediately since we don't need to load images
        this.init();
    }
    
    setupColorTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Check if the skin is locked
                if (tab.classList.contains('locked') && !tab.classList.contains('unlocked')) {
                    return; // Don't allow selection of locked skins
                }
                
                // Update active state
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update bird color
                this.bird.color = tab.dataset.color;
            });
        });
    }
    
    setupPauseMenu() {
        const resumeButton = this.pauseMenu.querySelector('.resume');
        const restartButton = this.pauseMenu.querySelector('.restart');
        const quitButton = this.pauseMenu.querySelector('.quit');
        const soundToggleButton = this.pauseMenu.querySelector('.sound-toggle');
        const hardModeToggleButton = this.pauseMenu.querySelector('.hard-mode-toggle');

        resumeButton.addEventListener('click', () => {
            this.togglePause();
        });

        restartButton.addEventListener('click', () => {
            this.resetGame();
        });

        quitButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to quit?')) {
                window.close();
            }
        });

        soundToggleButton.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            soundToggleButton.textContent = this.soundEnabled ? '🔊 Sound: On' : '🔈 Sound: Off';
            soundToggleButton.classList.toggle('muted', !this.soundEnabled);
        });

        hardModeToggleButton.addEventListener('click', () => {
            this.hardMode = !this.hardMode;
            hardModeToggleButton.textContent = this.hardMode ? '🎯 Hard Mode: On' : '🎯 Hard Mode: Off';
            hardModeToggleButton.classList.toggle('active', this.hardMode);
        });
    }
    
    init() {
        // Create initial pipes with random positions
        for (let i = 0; i < 3; i++) {
            // Random gap size between min and max
            const gapSize = Math.random() * (this.maxPipeGap - this.minPipeGap) + this.minPipeGap;
            
            // More random positioning, but still keeping it playable
            const minGapY = 50; // 50px from top
            const maxGapY = this.canvas.height - gapSize - 50; // 50px from bottom
            const gapY = Math.random() * (maxGapY - minGapY) + minGapY;
            
            this.pipes.push({
                x: this.canvas.width + this.pipeWidth + (i * 200), // Space pipes evenly
                gapY: gapY,
                gapSize: gapSize,
                passed: false
            });
        }
        
        // Show start message
        this.startMessage.style.display = 'block';
    }
    
    handleKeyPress(event) {
        if (event.code === 'Space') {
            if (!this.gameStarted) {
                this.startGame();
            } else if (this.gameOver) {
                this.resetGame();
            } else {
                this.jump();
            }
            // Play sound for any space press if sound is enabled
            if (this.soundEnabled) {
                this.jumpSound.currentTime = 0;
                this.jumpSound.play().catch(error => {
                    console.log('Error playing jump sound:', error);
                });
            }
        } else if (event.code === 'Escape') {
            this.togglePause();
        }
    }
    
    handleTouch(event) {
        event.preventDefault();
        if (!this.gameStarted) {
            this.startGame();
        } else if (this.gameOver) {
            this.resetGame();
        } else {
            this.jump();
        }
        // Play sound for touch events if sound is enabled
        if (this.soundEnabled) {
            this.jumpSound.currentTime = 0;
            this.jumpSound.play().catch(error => {
                console.log('Error playing jump sound:', error);
            });
        }
    }
    
    togglePause() {
        if (this.gameStarted && !this.gameOver) {
            this.isPaused = !this.isPaused;
            this.pauseButton.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
            this.pauseButton.classList.toggle('paused', this.isPaused);
            this.pauseMenu.style.display = this.isPaused ? 'block' : 'none';
        }
    }
    
    startGame() {
        this.gameStarted = true;
        this.startMessage.style.display = 'none';
        this.pauseButton.style.display = 'block';
        this.pauseMenu.style.display = 'none';
        this.gameLoop();
    }
    
    resetGame() {
        // Reset game state
        this.score = 0;
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        this.pipesPassed = 0; // Reset pipes passed counter
        this.currentTheme = 0; // Reset to first theme
        this.pipeSpeed = 2; // Reset pipe speed to initial value
        this.hardMode = false; // Reset hard mode
        document.querySelector('.hard-mode-toggle').textContent = '🎯 Hard Mode: Off';
        document.querySelector('.hard-mode-toggle').classList.remove('active');
        
        // Reset bird position and velocity
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.bird.color = '#FFD700'; // Reset to default yellow color
        
        // Clear pipes
        this.pipes = [];
        
        // Reset initial pipes flag
        this.initialPipesCreated = false;
        
        // Load unlocked skins from localStorage instead of resetting them
        this.loadUnlockedSkins();
        
        // Reset UI elements
        this.pauseButton.style.display = 'none';
        this.pauseButton.textContent = '⏸️ Pause';
        this.pauseButton.classList.remove('paused');
        this.pauseMenu.style.display = 'none';
        
        // Show start message
        this.startMessage.style.display = 'block';
        
        // Initialize the game with new pipes
        this.init();
    }
    
    jump() {
        this.bird.velocity = this.jumpForce;
    }
    
    addPipe() {
        // Random gap size between min and max
        const gapSize = Math.random() * (this.maxPipeGap - this.minPipeGap) + this.minPipeGap;
        
        // More random positioning, but still keeping it playable
        const minGapY = 50; // 50px from top
        const maxGapY = this.canvas.height - gapSize - 50; // 50px from bottom
        const gapY = Math.random() * (maxGapY - minGapY) + minGapY;
        
        this.pipes.push({
            x: this.canvas.width + this.pipeWidth,
            gapY: gapY,
            gapSize: gapSize,
            passed: false
        });
    }
    
    loadUnlockedSkins() {
        const unlockedSkins = JSON.parse(localStorage.getItem('unlockedSkins')) || ['#FFD700'];
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            const color = tab.dataset.color;
            if (unlockedSkins.includes(color)) {
                tab.classList.remove('locked');
                tab.classList.add('unlocked');
            }
        });
    }

    saveUnlockedSkins() {
        const unlockedSkins = Array.from(document.querySelectorAll('.tab.unlocked'))
            .map(tab => tab.dataset.color);
        localStorage.setItem('unlockedSkins', JSON.stringify(unlockedSkins));
    }

    checkUnlockedSkins() {
        const tabs = document.querySelectorAll('.tab.locked');
        let newUnlocks = false;
        
        tabs.forEach(tab => {
            const requiredScore = parseInt(tab.dataset.requiredScore);
            const requiresHardMode = tab.dataset.hardMode === 'true';
            
            // Check if the skin requires hard mode
            if (requiresHardMode) {
                // Only unlock in hard mode
                if (this.hardMode && this.score >= requiredScore && !tab.classList.contains('unlocked')) {
                    tab.classList.remove('locked');
                    tab.classList.add('unlocked');
                    newUnlocks = true;
                    this.showUnlockMessage(tab.querySelector('span').textContent);
                }
            } else {
                // Normal skin unlocking logic
                if (this.score >= requiredScore && !tab.classList.contains('unlocked')) {
                    tab.classList.remove('locked');
                    tab.classList.add('unlocked');
                    newUnlocks = true;
                    this.showUnlockMessage(tab.querySelector('span').textContent);
                }
            }
        });
        
        if (newUnlocks) {
            this.saveUnlockedSkins();
        }
    }

    showUnlockMessage(skinName) {
        // Create and show unlock message
        const message = document.createElement('div');
        message.className = 'unlock-message';
        message.textContent = `Unlocked: ${skinName} Skin!`;
        document.body.appendChild(message);
        
        // Remove message after animation
        setTimeout(() => {
            message.remove();
        }, 2000);
    }
    
    update() {
        // Update bird position
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;
        
        // Update bird rotation based on velocity
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 0.1, -Math.PI/4), Math.PI/4);
        
        // Check collisions with ground and ceiling
        if (this.bird.y + this.bird.height > this.canvas.height || this.bird.y < 0) {
            this.gameOver = true;
        }
        
        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;
            
            // Check collision with pipes
            if (this.bird.x + this.bird.width > pipe.x && 
                this.bird.x < pipe.x + this.pipeWidth) {
                if (this.bird.y < pipe.gapY || 
                    this.bird.y + this.bird.height > pipe.gapY + pipe.gapSize) {
                    this.gameOver = true;
                }
            }
            
            // Score point when passing pipe
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
                this.pipesPassed++; // Increment pipes passed counter
                this.scoreElement.textContent = `Score: ${this.score}`;
                
                // Increase speed in hard mode
                if (this.hardMode) {
                    this.pipeSpeed += 0.5;
                }
                
                // Change background theme and increase speed every 50 pipes (only in normal mode)
                if (!this.hardMode && this.pipesPassed % 50 === 0) {
                    this.currentTheme = (this.currentTheme + 1) % this.backgroundThemes.length;
                    this.pipeSpeed += 0.2; // Increase pipe speed by 0.2
                }
                
                // Update high score if current score is higher
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('flappyBirdHighScore', this.highScore);
                }
                // Check for newly unlocked skins
                this.checkUnlockedSkins();
            }
            
            // Remove off-screen pipes
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
        
        // Add new pipes
        if (this.pipes[this.pipes.length - 1].x < this.canvas.width - 200) {
            this.addPipe();
        }
    }
    
    drawBird() {
        const ctx = this.ctx;
        const bird = this.bird;
        
        ctx.save();
        ctx.translate(bird.x + bird.width/2, bird.y + bird.height/2);
        ctx.rotate(bird.rotation);
        
        // Body
        ctx.fillStyle = bird.color === '#FF1493' ? this.getRainbowColor() : bird.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, bird.width/2, bird.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing
        ctx.fillStyle = this.adjustColor(bird.color === '#FF1493' ? this.getRainbowColor() : bird.color, -20);
        ctx.beginPath();
        ctx.moveTo(-bird.width/4, 0);
        ctx.quadraticCurveTo(-bird.width/2, -bird.height/2, -bird.width/4, -bird.height/3);
        ctx.quadraticCurveTo(0, -bird.height/4, -bird.width/4, 0);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#FF4500'; // Changed to a darker orange color
        ctx.beginPath();
        ctx.moveTo(bird.width/4, 0);
        ctx.lineTo(bird.width/2, -bird.height/6);
        ctx.lineTo(bird.width/2, bird.height/6);
        ctx.closePath();
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(bird.width/6, -bird.height/6, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye highlight
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(bird.width/6 - 1, -bird.height/6 - 1, 1, 0, Math.PI * 2);
        ctx.fill();

        // Hat
        ctx.fillStyle = bird.color === '#FF1493' ? this.getRainbowColor() : bird.color;
        // Hat brim
        ctx.fillRect(-bird.width/2, -bird.height/2, bird.width, 3);
        // Hat top
        ctx.fillRect(-bird.width/3, -bird.height/2 - 10, bird.width/1.5, 10);
        // Hat band
        ctx.fillStyle = this.adjustColor(bird.color === '#FF1493' ? this.getRainbowColor() : bird.color, 20);
        ctx.fillRect(-bird.width/3, -bird.height/2 - 3, bird.width/1.5, 2);
        
        ctx.restore();
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sky background
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].sky;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw city skyline
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].buildings;
        
        // Draw various buildings
        // First set of buildings (left side)
        this.ctx.fillRect(10, this.canvas.height - 100, 30, 100);
        this.ctx.fillRect(50, this.canvas.height - 120, 40, 120);
        this.ctx.fillRect(100, this.canvas.height - 140, 25, 140);
        
        // Tall skyscraper with antenna
        this.ctx.fillRect(140, this.canvas.height - 170, 35, 170);
        this.ctx.fillRect(152, this.canvas.height - 190, 10, 20);
        
        // Middle buildings
        this.ctx.fillRect(190, this.canvas.height - 110, 45, 110);
        this.ctx.fillRect(245, this.canvas.height - 130, 30, 130);
        
        // Right side buildings
        this.ctx.fillRect(285, this.canvas.height - 120, 50, 120);
        this.ctx.fillRect(345, this.canvas.height - 90, 40, 90);
        
        // Add windows to buildings (small yellow squares)
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].windows;
        
        // Windows for left buildings
        for (let x = 15; x < 35; x += 10) {
            for (let y = this.canvas.height - 90; y < this.canvas.height - 10; y += 15) {
                this.ctx.fillRect(x, y, 5, 5);
            }
        }
        
        // Windows for middle buildings
        for (let x = 55; x < 85; x += 10) {
            for (let y = this.canvas.height - 110; y < this.canvas.height - 10; y += 15) {
                this.ctx.fillRect(x, y, 5, 5);
            }
        }
        
        // Windows for tall skyscraper
        for (let x = 145; x < 170; x += 10) {
            for (let y = this.canvas.height - 160; y < this.canvas.height - 10; y += 15) {
                this.ctx.fillRect(x, y, 5, 5);
            }
        }
        
        // Windows for right buildings
        for (let x = 290; x < 330; x += 10) {
            for (let y = this.canvas.height - 110; y < this.canvas.height - 10; y += 15) {
                this.ctx.fillRect(x, y, 5, 5);
            }
        }
        
        // Draw mountains
        // First layer - background mountains (darkest)
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].mountains[0];
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        
        // Background mountain range
        this.ctx.bezierCurveTo(
            50, this.canvas.height - 130,
            100, this.canvas.height - 180,
            150, this.canvas.height - 120
        );
        this.ctx.bezierCurveTo(
            200, this.canvas.height - 160,
            250, this.canvas.height - 190,
            300, this.canvas.height - 140
        );
        this.ctx.bezierCurveTo(
            350, this.canvas.height - 170,
            380, this.canvas.height - 150,
            400, this.canvas.height
        );
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Second layer - mid-distance mountains
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].mountains[1];
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        
        // Mid-distance mountain range
        this.ctx.bezierCurveTo(
            70, this.canvas.height - 90,
            120, this.canvas.height - 140,
            180, this.canvas.height - 100
        );
        this.ctx.bezierCurveTo(
            240, this.canvas.height - 130,
            280, this.canvas.height - 110,
            340, this.canvas.height - 120
        );
        this.ctx.bezierCurveTo(
            380, this.canvas.height - 90,
            390, this.canvas.height - 80,
            400, this.canvas.height
        );
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Third layer - foreground hills (lightest)
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].mountains[2];
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        
        // First hill - smoother and more rounded
        this.ctx.bezierCurveTo(
            50, this.canvas.height - 70,  // control point 1
            80, this.canvas.height - 100, // control point 2
            150, this.canvas.height - 80  // end point
        );
        
        // Connect to second hill with a gentle valley
        this.ctx.bezierCurveTo(
            200, this.canvas.height - 60,  // control point 1
            220, this.canvas.height - 50,  // control point 2
            250, this.canvas.height - 70   // end point
        );
        
        // Second hill - smoother and more rounded
        this.ctx.bezierCurveTo(
            300, this.canvas.height - 110, // control point 1
            350, this.canvas.height - 90,  // control point 2
            400, this.canvas.height        // end point
        );
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw grass
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].grass;
        this.ctx.fillRect(0, this.canvas.height - 30, this.canvas.width, 30);
        
        // Draw grass blades
        this.ctx.fillStyle = this.backgroundThemes[this.currentTheme].grassBlades;
        for (let i = 0; i < this.canvas.width; i += 5) {
            const height = 5 + Math.random() * 10;  // Random height between 5-15px
            this.ctx.fillRect(i, this.canvas.height - 30 - height, 2, height);
        }
        
        // Draw clouds
        this.ctx.fillStyle = 'white';
        this.drawCloud(50, 100);
        this.drawCloud(200, 150);
        this.drawCloud(350, 80);
        
        // Draw bird
        this.drawBird();
        
        // Draw pipes
        this.pipes.forEach(pipe => {
            // Pipe body color
            this.ctx.fillStyle = '#2ECC71';
            
            // Upper pipe
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.gapY);
            // Upper pipe cap
            this.ctx.fillRect(pipe.x - 5, pipe.gapY - 20, this.pipeWidth + 10, 20);
            
            // Lower pipe
            this.ctx.fillRect(pipe.x, pipe.gapY + pipe.gapSize, 
                            this.pipeWidth, this.canvas.height - pipe.gapY - pipe.gapSize);
            // Lower pipe cap
            this.ctx.fillRect(pipe.x - 5, pipe.gapY + pipe.gapSize, this.pipeWidth + 10, 20);
        });
        
        // Draw score and high score
        this.ctx.fillStyle = '#FFD700'; // Gold color for high score
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width - 20, 40);
        
        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw "Game Over!" text
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 60);
            
            // Draw inspirational quote with word wrap
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#FFD700';
            const quote = this.inspirationalQuotes[Math.floor(Math.random() * this.inspirationalQuotes.length)];
            const maxWidth = this.canvas.width - 40; // Leave 20px margin on each side
            const words = quote.split(' ');
            let line = '';
            let lines = [];
            
            words.forEach(word => {
                const testLine = line + word + ' ';
                const metrics = this.ctx.measureText(testLine);
                if (metrics.width > maxWidth) {
                    lines.push(line);
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            });
            lines.push(line);
            
            // Draw each line of the quote
            lines.forEach((line, index) => {
                this.ctx.fillText(line, this.canvas.width / 2, this.canvas.height / 2 - 20 + (index * 20));
            });
            
            // Draw restart instruction
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText('Press Space to Restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
            
            // Draw credits
            this.ctx.font = '16px Arial';
            this.ctx.fillText('by Matthew Rowe', this.canvas.width / 2, this.canvas.height / 2 + 70);
        }
    }
    
    // Helper method to draw clouds
    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 20, y - 10, 15, 0, Math.PI * 2);
        this.ctx.arc(x + 20, y + 10, 15, 0, Math.PI * 2);
        this.ctx.arc(x + 40, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    gameLoop() {
        if (!this.gameOver && !this.isPaused) {
            this.update();
            this.draw();
            requestAnimationFrame(this.gameLoop.bind(this));
        } else if (!this.gameOver && this.isPaused) {
            // Draw the current game state while paused
            this.draw();
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    // Add this new method for rainbow color
    getRainbowColor() {
        this.bird.rainbowHue = (this.bird.rainbowHue + 1) % 360;
        return `hsl(${this.bird.rainbowHue}, 100%, 50%)`;
    }
}

// Start the game when the page loads
window.onload = () => {
    new FlappyBird();
}; 