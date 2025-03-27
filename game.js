class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.startMessage = document.getElementById('startMessage');
        
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
        
        // Bird properties
        this.bird = {
            x: 100,
            y: this.canvas.height / 2,
            width: 35,
            height: 25,
            velocity: 0,
            rotation: 0
        };
        
        // Add flag for initial pipes
        this.initialPipesCreated = false;
        
        // Load bird image
        this.birdImage = new Image();
        this.birdImage.onload = () => {
            // Initialize game only after image is loaded
            this.init();
        };
        this.birdImage.src = 'assets/bird.png';
        
        // Pipes array
        this.pipes = [];
        
        // Event listeners
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.addEventListener('touchstart', this.handleTouch.bind(this));
    }
    
    init() {
        // Create initial pipes with random positions
        for (let i = 0; i < 3; i++) {
            const gapSize = Math.random() * (this.maxPipeGap - this.minPipeGap) + this.minPipeGap;
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
    }
    
    startGame() {
        this.gameStarted = true;
        this.startMessage.style.display = 'none';
        this.gameLoop();
    }
    
    resetGame() {
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.pipes = [];
        this.score = 0;
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.gameOver = false;
        this.gameStarted = true;
        this.startMessage.style.display = 'none';
        this.initialPipesCreated = false; // Reset the flag
        this.init();
        this.gameLoop();
    }
    
    jump() {
        this.bird.velocity = this.jumpForce;
    }
    
    addPipe() {
        // If we're still creating initial pipes, use fixed positions
        if (!this.initialPipesCreated) {
            const fixedGapSize = 220;
            const fixedGapY = (this.canvas.height - fixedGapSize) / 2;
            
            this.pipes.push({
                x: this.canvas.width + this.pipeWidth,
                gapY: fixedGapY,
                gapSize: fixedGapSize,
                passed: false
            });
            
            // After creating 4 pipes, switch to random gaps
            if (this.pipes.length >= 4) {
                this.initialPipesCreated = true;
            }
        } else {
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
                this.scoreElement.textContent = `Score: ${this.score}`;
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
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sky background
        this.ctx.fillStyle = '#87CEEB';  // Sky blue
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw city skyline
        this.ctx.fillStyle = '#2C3E50';  // Dark blue for city silhouette
        
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
        this.ctx.fillStyle = '#F1C40F';  // Yellow for windows
        
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
        this.ctx.fillStyle = '#2A2A2A';  // Darkest gray for distant mountains
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
        this.ctx.fillStyle = '#3A3A3A';  // Medium gray for mid mountains
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
        this.ctx.fillStyle = '#4A4A4A';  // Light gray for foreground hills
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
        this.ctx.fillStyle = '#4CAF50';  // Green color for grass
        this.ctx.fillRect(0, this.canvas.height - 30, this.canvas.width, 30);
        
        // Draw grass blades
        this.ctx.fillStyle = '#66BB6A';  // Lighter green for grass blades
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
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.width/2, this.bird.y + this.bird.height/2);
        this.ctx.rotate(this.bird.rotation);
        this.ctx.drawImage(
            this.birdImage,
            -this.bird.width/2,
            -this.bird.height/2,
            this.bird.width,
            this.bird.height
        );
        this.ctx.restore();
        
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
        
        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Press Space to Restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('by Matthew Rowe', this.canvas.width / 2, this.canvas.height / 2 + 80);
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
        if (!this.gameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
}

// Start the game when the page loads
window.onload = () => {
    new FlappyBird();
}; 