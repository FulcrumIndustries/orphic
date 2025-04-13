const { v4: uuidv4 } = require('uuid');
const colorThemeService = require('../services/colorTheme.service');
const fontSelectionService = require('../services/fontSelection.service');
const logoPromptService = require('../services/logoPrompt.service');
const imagePromptService = require('../services/imagePrompt.service');

// In-memory storage for demo purposes, in a real app this would be a database
const brandResults = new Map();
const brandStatus = new Map();

// SSE clients
const sseClients = new Map();

// Object to store processing statuses and results (in-memory DB)
const jobStatuses = {};

// Add a new SSE client
function addClient(clientId, res) {
    sseClients.set(clientId, res);
    console.log(`Client ${clientId} connected. Total clients: ${sseClients.size}`);

    // Send the latest status if available when a client connects
    const currentStatus = brandStatus.get(clientId);
    if (currentStatus) {
        console.log(`Sending current status to newly connected client ${clientId}:`, currentStatus);
        sendUpdate(clientId, currentStatus);
    }
}

// Remove an SSE client
function removeClient(clientId) {
    sseClients.delete(clientId);
    console.log(`Client ${clientId} disconnected. Remaining clients: ${sseClients.size}`);
}

// Send update to a specific client
function sendUpdate(clientId, data) {
    const client = sseClients.get(clientId);
    if (client) {
        console.log(`Sending update to client ${clientId}:`, JSON.stringify(data));
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    } else {
        console.log(`Client ${clientId} not connected yet, storing status for later delivery`);
        // We still update the status in memory even if client isn't connected yet
        brandStatus.set(clientId, data);
    }
}

// Global SSE updates (for clients not tied to a specific job)
const sendGlobalUpdate = (data) => {
    sseClients.forEach((client) => {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
};

// Add a function to store partial results
function storePartialResult(jobId, section, data) {
    console.log(`Storing partial result for job ${jobId}, section: ${section}`);

    if (!jobStatuses[jobId]) {
        jobStatuses[jobId] = { results: {} };
    }

    if (!jobStatuses[jobId].results) {
        jobStatuses[jobId].results = {};
    }

    // Special logging for imagePrompts
    if (section === 'imagePrompts') {
        console.log('=== IMAGE PROMPTS DEBUG LOG ===');
        console.log('imagePrompts data type:', typeof data);
        console.log('Is array:', Array.isArray(data));

        if (Array.isArray(data)) {
            console.log('Number of image prompts:', data.length);
            data.forEach((prompt, index) => {
                console.log(`Prompt ${index + 1} title:`, prompt.title);
                console.log(`Prompt ${index + 1} first 50 chars:`, String(prompt.prompt).substring(0, 50) + '...');
            });
        } else if (typeof data === 'string') {
            console.log('String data length:', data.length);
            console.log('First 100 chars:', data.substring(0, 100) + '...');

            // Try to parse if it's JSON
            if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(data);
                    console.log('Parsed data type:', typeof parsed);
                    console.log('Is parsed data an array:', Array.isArray(parsed));
                    console.log('Parsed data item count:', Array.isArray(parsed) ? parsed.length : 'N/A');

                    // Convert string to array if it's JSON
                    if (Array.isArray(parsed)) {
                        console.log('Converting JSON string to array');
                        data = parsed;
                    }
                } catch (e) {
                    console.error('Failed to parse imagePrompts string as JSON:', e.message);
                }
            }
        } else {
            console.log('Data structure:', JSON.stringify(data, null, 2));
        }
        console.log('=== END IMAGE PROMPTS DEBUG LOG ===');
    }

    // Store the partial result
    jobStatuses[jobId].results[section] = data;
    console.log(`Stored ${section} data for job ${jobId}`);

    // Update the job status to indicate section completion
    updateStatus(jobId, `${section} generation completed`, getProgressForSection(section));
}

// Get the progress percentage for a specific section
function getProgressForSection(section) {
    switch (section) {
        case 'colorTheme':
            return 30;
        case 'fonts':
            return 50;
        case 'logoPrompt':
            return 70;
        case 'imagePrompts':
            return 90;
        default:
            return 0;
    }
}

// Modified process function to store partial results
async function processBrandIdentity(req, res) {
    const {
        companyName,
        productName,
        companyDescription,
        brandTraits,
        competitorInfo,
        colorSchemeType,
        baseColor,
        mood
    } = req.body;

    console.log('Processing brand identity for:', companyName);
    console.log('Color scheme parameters:', { colorSchemeType, baseColor, mood });

    const clientId = req.headers['x-client-id'] || uuidv4();

    // Timing measurements
    const startTime = Date.now();
    let stepStartTime = startTime;

    // Function to measure step duration
    const measureStep = () => {
        const now = Date.now();
        const duration = ((now - stepStartTime) / 1000).toFixed(1);
        stepStartTime = now;
        return duration; // Return just the number, not formatted with "s"
    };

    // Send initial status update
    await updateStatus(clientId, 'Processing brand identity...', 10);

    try {
        // Process tasks sequentially instead of in parallel

        // Step 1: Generate color themes
        await updateStatus(clientId, 'Generating color themes...', 20);
        const colorTheme = await colorThemeService.generateColorTheme(
            brandTraits || companyDescription,
            colorSchemeType,
            baseColor,
            mood
        );
        const colorTime = measureStep();
        await updateStatus(clientId, `Color themes generated - ${colorTime}s`, 30);
        storePartialResult(clientId, 'colorTheme', colorTheme);

        // Step 2: Generate font selection
        await updateStatus(clientId, 'Selecting fonts...', 40);
        const fonts = await fontSelectionService.selectFonts(brandTraits || companyDescription, companyName);
        const fontTime = measureStep();
        await updateStatus(clientId, `Fonts selected - ${fontTime}s`, 50);
        storePartialResult(clientId, 'fonts', fonts);

        // Step 3: Generate logo prompt
        await updateStatus(clientId, 'Creating logo prompt...', 60);
        let logoPrompt;
        try {
            logoPrompt = await logoPromptService.generateLogoPrompt(companyName, companyDescription, colorTheme);
        } catch (logoError) {
            console.error('Error generating logo prompt:', logoError);
            // Create a fallback logo prompt with proper structure
            logoPrompt = {
                prompt: `Create a minimalist, typography-focused logo for "${companyName}" using a clean, modern sans-serif font.`,
                primaryColor: colorTheme && colorTheme.colors && colorTheme.colors.length > 0 ?
                    colorTheme.colors[0].hex : "#1A5F7A"
            };
        }
        const logoTime = measureStep();
        await updateStatus(clientId, `Logo prompt created - ${logoTime}s`, 70);
        storePartialResult(clientId, 'logoPrompt', logoPrompt);

        // Step 4: Generate image prompt
        await updateStatus(clientId, 'Creating image prompts...', 80);
        const imagePrompts = await imagePromptService.generateImagePrompts(companyDescription, colorTheme);
        const imageTime = measureStep();
        await updateStatus(clientId, `Image prompts created - ${imageTime}s`, 90);

        // Extra logging and validation before storing image prompts
        console.log('=== IMAGE PROMPTS VALIDATION ===');
        console.log('Raw imagePrompts received from service:', typeof imagePrompts);

        let validatedImagePrompts = imagePrompts;

        // Ensure we have an array
        if (!Array.isArray(validatedImagePrompts)) {
            console.error('WARNING: imagePrompts is not an array, attempting to fix...');

            if (typeof validatedImagePrompts === 'string') {
                try {
                    // Try to parse JSON string
                    const parsed = JSON.parse(validatedImagePrompts);
                    if (Array.isArray(parsed)) {
                        console.log('Successfully parsed string to array with', parsed.length, 'items');
                        validatedImagePrompts = parsed;
                    } else {
                        console.error('Parsed result is not an array, wrapping in array');
                        validatedImagePrompts = [parsed];
                    }
                } catch (e) {
                    console.error('Failed to parse string as JSON, wrapping as-is in array');
                    validatedImagePrompts = [{ title: 'Image Prompt', prompt: validatedImagePrompts }];
                }
            } else if (validatedImagePrompts && typeof validatedImagePrompts === 'object') {
                console.log('Converting object to array');
                validatedImagePrompts = [validatedImagePrompts];
            } else {
                console.error('Unable to convert to valid format, creating fallback');
                validatedImagePrompts = [
                    { title: 'Fallback Image 1', prompt: 'A professional image for the brand' },
                    { title: 'Fallback Image 2', prompt: 'A creative visualization of the brand values' },
                    { title: 'Fallback Image 3', prompt: 'A modern representation of the brand in action' }
                ];
            }
        }

        // Ensure each prompt has title and prompt properties
        validatedImagePrompts = validatedImagePrompts.map((item, index) => {
            if (typeof item === 'string') {
                return { title: `Image ${index + 1}`, prompt: item };
            }
            if (!item.title) {
                return { ...item, title: `Image ${index + 1}` };
            }
            if (!item.prompt && typeof item === 'object') {
                return { title: item.title, prompt: JSON.stringify(item) };
            }
            return item;
        });

        // Log final validated prompts
        console.log('Final imagePrompts structure:');
        validatedImagePrompts.forEach((prompt, i) => {
            console.log(`[${i}] Title: "${prompt.title}", Prompt starts with: "${String(prompt.prompt).substring(0, 30)}..."`);
        });
        console.log('=== END IMAGE PROMPTS VALIDATION ===');

        storePartialResult(clientId, 'imagePrompts', validatedImagePrompts);

        // Construct the final results object
        const result = {
            brandName: companyName,
            brandDescription: companyDescription,
            colorTheme: colorTheme,
            fonts: fonts,
            logoPrompt: logoPrompt,
            imagePrompts: validatedImagePrompts
        };

        // Store in-memory
        brandResults.set(clientId, result);

        // Calculate total time
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

        // Send completion status
        await updateStatus(clientId, `Brand identity complete - Total: ${totalTime}s`, 100, true);

        return result;
    } catch (error) {
        console.error('Error processing brand identity:', error);
        await updateStatus(clientId, `Error: ${error.message}`, -1);
        throw error;
    }
}

// Helper function to update status
async function updateStatus(jobId, status, progress, completed = false) {
    const updatedStatus = {
        jobId,
        status,
        progress,
        completed
    };

    // Always store the latest status
    brandStatus.set(jobId, updatedStatus);

    // Only send update if client is connected
    const client = sseClients.get(jobId);
    if (client) {
        console.log(`Sending update to client ${jobId}:`, updatedStatus);
        client.write(`data: ${JSON.stringify(updatedStatus)}\n\n`);
    } else {
        console.log(`Client ${jobId} not connected yet, status will be sent when they connect`);
    }

    console.log(`Job ${jobId} status: ${status}, progress: ${progress}%`);
}

// Controller methods
exports.createBrand = async (req, res) => {
    try {
        console.log('Received brand creation request:', req.body);
        const {
            companyName,
            companyDescription,
            colorSchemeType,
            baseColor,
            mood
        } = req.body;

        // Validate input
        if (!companyName || !companyDescription) {
            console.error('Missing required fields:', { companyName, companyDescription });
            return res.status(400).json({
                success: false,
                message: 'Company name and description are required'
            });
        }

        // Generate unique ID for this request
        const clientId = uuidv4();
        console.log(`Generated clientId: ${clientId} for company: ${companyName}`);

        // Initialize response
        const responseData = {
            success: true,
            jobId: clientId,
            message: 'Brand identity generation started'
        };

        console.log('Sending initial response:', responseData);
        res.status(200).json(responseData);

        // Initialize status
        brandStatus.set(clientId, {
            status: 'Received inputs...',
            progress: 5,
            completed: false
        });

        // Start processing in background (after sending response)
        console.log(`Starting processBrandIdentity for client ${clientId}`);
        processBrandIdentity({
            body: {
                companyName,
                companyDescription,
                colorSchemeType,
                baseColor,
                mood
            },
            headers: { 'x-client-id': clientId }
        }, null).catch(err => {
            console.error(`Error in brand identity processing for client ${clientId}:`, err);
        });

    } catch (error) {
        console.error('Error creating brand:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

exports.getBrandResults = (req, res) => {
    const { id } = req.params;
    console.log(`Received results request for job ID: ${id}`);

    // Check if results are available
    const results = brandResults.get(id);

    if (results) {
        console.log(`Found results for job ${id}, sending success response`);
        // Log a summary of the results
        console.log(`Results summary for ${id}:`, {
            brandName: results.brandName,
            brandDescription: results.brandDescription ? results.brandDescription.substring(0, 30) + '...' : undefined,
            colorThemeAvailable: !!results.colorTheme,
            fontsAvailable: !!results.fonts,
            logoPromptAvailable: !!results.logoPrompt,
            imagePromptsAvailable: !!results.imagePrompts
        });

        // For debugging, log the structure of results.colorTheme
        if (results.colorTheme) {
            console.log(`Color theme structure:`, {
                schemeType: results.colorTheme.schemeType,
                colorsCount: results.colorTheme.colors ? results.colorTheme.colors.length : 0,
                sampleColor: results.colorTheme.colors && results.colorTheme.colors.length > 0 ? results.colorTheme.colors[0] : null
            });
        }

        // Add detailed logging for image prompts
        if (results.imagePrompts) {
            console.log('=== IMAGE PROMPTS RESPONSE DEBUG ===');
            console.log('Image prompts type:', typeof results.imagePrompts);
            console.log('Is array:', Array.isArray(results.imagePrompts));
            console.log('Length/size:', Array.isArray(results.imagePrompts) ?
                results.imagePrompts.length :
                (typeof results.imagePrompts === 'string' ? results.imagePrompts.length : 'unknown'));

            // If it's an array, examine the first item
            if (Array.isArray(results.imagePrompts) && results.imagePrompts.length > 0) {
                const firstPrompt = results.imagePrompts[0];
                console.log('First prompt structure:', {
                    type: typeof firstPrompt,
                    hasTitle: !!firstPrompt.title,
                    hasPrompt: !!firstPrompt.prompt,
                    titleSample: firstPrompt.title ? firstPrompt.title : 'N/A',
                    promptSample: firstPrompt.prompt ? String(firstPrompt.prompt).substring(0, 50) + '...' : 'N/A'
                });

                // List all image prompts briefly
                results.imagePrompts.forEach((prompt, i) => {
                    console.log(`Image prompt [${i}]:`, {
                        title: prompt.title || 'NO TITLE',
                        promptStart: String(prompt.prompt || '').substring(0, 30) + '...'
                    });
                });
            }
            // If it's a string, examine if it looks like JSON
            else if (typeof results.imagePrompts === 'string') {
                console.log('String content starts with:', results.imagePrompts.substring(0, 100) + '...');
                if (results.imagePrompts.trim().startsWith('[')) {
                    console.log('WARNING: Image prompts appears to be a JSON string array that needs parsing');

                    // Fix: If it's a JSON string, let's fix it before sending to client
                    try {
                        const parsed = JSON.parse(results.imagePrompts);
                        if (Array.isArray(parsed)) {
                            console.log('Automatically parsed string to array with', parsed.length, 'items');
                            results.imagePrompts = parsed; // Replace with the parsed array
                        }
                    } catch (e) {
                        console.error('Failed to parse image prompts JSON string:', e.message);
                    }
                }
            }
            console.log('=== END IMAGE PROMPTS RESPONSE DEBUG ===');
        }

        return res.status(200).json({
            success: true,
            results
        });
    } else {
        console.log(`No results found for job ${id}`);

        // Check if the job exists but is not complete
        const jobStatus = brandStatus.get(id);
        if (jobStatus) {
            console.log(`Job ${id} exists but is not complete. Status:`, jobStatus);
            return res.status(202).json({
                success: false,
                message: 'Processing in progress, results not ready yet',
                status: jobStatus
            });
        }

        // Job not found
        console.log(`Job ${id} not found in brandStatus map`);
        return res.status(404).json({
            success: false,
            message: 'Results not found or processing not complete'
        });
    }
};

// SSE endpoint handler
exports.statusUpdates = (req, res) => {
    const jobId = req.query.jobId;
    console.log(`SSE connection request received for jobId: ${jobId || 'none'}`);

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // If a job ID is provided, send job-specific updates
    if (jobId) {
        // Register client for job-specific updates (do this first to ensure no updates are missed)
        console.log(`Registering client for job-specific updates: ${jobId}`);
        addClient(jobId, res);

        // Send current status (this is now handled by addClient)
        // The current status should be immediately sent after registration

        // Also check if results are already available for this job
        const results = brandResults.get(jobId);
        if (results) {
            console.log(`Results already available for job ${jobId}, sending completed status`);
            // Send a completed status update
            res.write(`data: ${JSON.stringify({
                jobId,
                status: 'Brand identity complete',
                progress: 100,
                completed: true
            })}\n\n`);
        }

        // Handle client disconnect
        req.on('close', () => {
            console.log(`Client ${jobId} connection closed`);
            removeClient(jobId);
        });
    } else {
        // For general status updates (not tied to a specific job)
        const clientId = uuidv4();
        console.log(`Generated general SSE clientId: ${clientId}`);

        // Send initial connection message
        console.log(`Sending initial connection message to general client ${clientId}`);
        res.write(`data: ${JSON.stringify({ status: 'Connected to SSE', progress: 0 })}\n\n`);

        // Register client for general updates
        addClient(clientId, res);

        // Handle client disconnect
        req.on('close', () => {
            console.log(`General client ${clientId} connection closed`);
            removeClient(clientId);
        });
    }

    // Keep the connection alive with a heartbeat
    const heartbeatInterval = setInterval(() => {
        console.log(`Sending heartbeat to ${jobId || 'general client'}`);
        res.write(`: heartbeat\n\n`);
    }, 15000);

    // Clean up on close
    req.on('close', () => {
        console.log(`Clearing heartbeat interval for ${jobId || 'general client'}`);
        clearInterval(heartbeatInterval);
    });
};

// Modify getResults to support partial results retrieval
exports.getResults = async (req, res) => {
    const { id } = req.params;
    const { section } = req.query;

    console.log(`Results requested for job ${id}${section ? `, section: ${section}` : ''}`);

    if (!id) {
        return res.status(400).json({ success: false, message: "Job ID is required" });
    }

    try {
        if (!jobStatuses[id]) {
            return res.status(404).json({
                success: false,
                message: "Job not found. Results may have expired or job ID is invalid.",
            });
        }

        // If a specific section is requested, return only that section
        if (section && jobStatuses[id].results) {
            // Return partial results for the requested section if available
            if (jobStatuses[id].results[section]) {
                // Special handling for imagePrompts section
                if (section === 'imagePrompts') {
                    console.log('=== IMAGE PROMPTS SECTION REQUEST DEBUG ===');
                    let imagePrompts = jobStatuses[id].results[section];

                    console.log('Original imagePrompts type:', typeof imagePrompts);
                    console.log('Is array:', Array.isArray(imagePrompts));

                    // Ensure we're sending an array of properly formatted objects
                    if (typeof imagePrompts === 'string') {
                        try {
                            // Try to parse JSON
                            if (imagePrompts.trim().startsWith('[')) {
                                console.log('Parsing imagePrompts string as JSON array');
                                const parsed = JSON.parse(imagePrompts);
                                if (Array.isArray(parsed)) {
                                    imagePrompts = parsed;
                                    console.log('Successfully parsed into array with', parsed.length, 'items');
                                }
                            } else {
                                // Not JSON, wrap as single item
                                console.log('Wrapping string in object and array');
                                imagePrompts = [{ title: 'Image Prompt', prompt: imagePrompts }];
                            }
                        } catch (e) {
                            console.error('Failed to parse imagePrompts JSON string:', e.message);
                            imagePrompts = [{ title: 'Image Prompt', prompt: imagePrompts }];
                        }
                    } else if (!Array.isArray(imagePrompts) && imagePrompts) {
                        // Single object - wrap in array
                        console.log('Wrapping single object in array');
                        imagePrompts = [imagePrompts];
                    }

                    // Ensure each item has title and prompt
                    if (Array.isArray(imagePrompts)) {
                        imagePrompts = imagePrompts.map((item, index) => {
                            if (typeof item === 'string') {
                                return { title: `Image ${index + 1}`, prompt: item };
                            }
                            return {
                                title: item.title || `Image ${index + 1}`,
                                prompt: item.prompt || JSON.stringify(item)
                            };
                        });
                    }

                    console.log('Final imagePrompts structure:',
                        Array.isArray(imagePrompts) ?
                            `Array with ${imagePrompts.length} items` :
                            typeof imagePrompts);

                    if (Array.isArray(imagePrompts) && imagePrompts.length > 0) {
                        console.log('First item:', {
                            title: imagePrompts[0].title,
                            promptStart: String(imagePrompts[0].prompt).substring(0, 50) + '...'
                        });
                    }

                    console.log('=== END IMAGE PROMPTS SECTION REQUEST DEBUG ===');

                    // Update the stored value with the properly formatted version
                    jobStatuses[id].results[section] = imagePrompts;
                }

                return res.json({
                    success: true,
                    results: {
                        [section]: jobStatuses[id].results[section],
                        // Always include brand name and description if available
                        ...(jobStatuses[id].results.brandName && { brandName: jobStatuses[id].results.brandName }),
                        ...(jobStatuses[id].results.brandDescription && { brandDescription: jobStatuses[id].results.brandDescription })
                    }
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: `Section '${section}' not found or not yet generated for this job.`,
                });
            }
        }

        // If no specific section is requested, return all results
        if (jobStatuses[id].results) {
            // Special handling for imagePrompts in full results
            if (jobStatuses[id].results.imagePrompts) {
                const imagePromptsSection = 'imagePrompts';
                let imagePrompts = jobStatuses[id].results[imagePromptsSection];

                // Similar validation as above for the entire results set
                if (typeof imagePrompts === 'string' && imagePrompts.trim().startsWith('[')) {
                    try {
                        const parsed = JSON.parse(imagePrompts);
                        if (Array.isArray(parsed)) {
                            jobStatuses[id].results[imagePromptsSection] = parsed;
                            console.log('Fixed imagePrompts JSON string in full results response');
                        }
                    } catch (e) {
                        console.error('Failed to parse imagePrompts in full results:', e.message);
                    }
                }
            }

            return res.json({
                success: true,
                results: jobStatuses[id].results,
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "Results not found. Brand identity generation may still be in progress.",
            });
        }
    } catch (error) {
        console.error("Error retrieving results:", error);
        return res.status(500).json({
            success: false,
            message: "Error retrieving results",
            error: error.message,
        });
    }
}; 