// Obra icons dev tools

// Load the UI
figma.showUI(__html__, { width: 300, height: 300 });

// Message handlers
figma.ui.onmessage = async (msg) => {

  if (msg.type === 'resizeWindow') {
    figma.ui.resize(300, msg.height);
  }
  
  if (msg.type === 'create-dev-copy') {
      createDevCopy();
  }
  
  if (msg.type === 'create-design-copy') {
      createDesignCopy();
  }
  
  if (msg.type === 'merge-auto-layout-groups') {
      mergeAutoLayoutGroups();
  }

  if (msg.type === 'harmonize-strokes-and-fills') {
      harmonizeStrokesAndFills();
  }

  if (msg.type === 'delete-key-shapes') {
      deleteKeyShapes();
  }

  if (msg.type === 'report-fill-and-stroke') {
      reportFillAndStroke();
  }

    if (msg.type === 'remove-all-bitmap-images') {
        removeAllBitmapImages();
    }

    if (msg.type === 'remove-all-top-level-text-layers') {
      removeAllTopLevelTextLayers();
  }

  if (msg.type === 'set-constraints-scale') {
      setConstraintsScale(figma.currentPage.selection);
  }

  if (msg.type === 'report-on-groups') {
      reportOnGroups(figma.currentPage.selection);
  }

  if (msg.type === 'report-on-duplicate-icons') {
      reportOnDuplicateIcons(figma.currentPage.selection);
  }

    if (msg.type === 'set-stroke-weight-to-one') {
        setStrokeWeightToOne();
    }

    if (msg.type === 'auto-colour-named-layers') {
        autoColourNamedLayers(figma.currentPage.selection);
    }

}

/*
 * General - load fonts
 */


async function loadFonts() {
    await Promise.all([
        figma.loadFontAsync({
            family: "Inter",
            style: "Regular"
        }),
    ])
}


/*
 * Debug actions - Scan for group layers
 */

function reportOnGroups() {
    alert('To implement')
}

/*
 * Debug action - Scan for duplicate icons
 */

function scanLayersForDuplicates(layer, layerNames) {
  if (layer.type === 'FRAME' || layer.type === 'GROUP') {
    for (const child of layer.children) {
      scanLayersForDuplicates(child, layerNames);
    }
  } else if (layer.width === 24 && layer.height === 24) {
    layerNames[layer.name] = (layerNames[layer.name] || 0) + 1;
  }
}

function findDuplicates(layerNames) {
  const duplicates = [];
  for (const [name, count] of Object.entries(layerNames)) {
    if (count > 1) {
      // Don't report key shape template layers
      if (name != 'Key shape template') {
        duplicates.push(name);
      }
    }
  }
  return duplicates;
}

function reportOnDuplicateIcons() {
  const selectedLayers = figma.currentPage.selection;
  
  if (selectedLayers.length !== 1 || selectedLayers[0].type !== 'FRAME') {
    figma.notify('Please select a single artboard');
    figma.closePlugin();
    return;
  }

  const artboard = selectedLayers[0];
  const layerNames = {};
  scanLayersForDuplicates(artboard, layerNames);

  const duplicates = findDuplicates(layerNames);
  

  
  if (duplicates.length > 0) {
    figma.notify(`Duplicate layers found: ${duplicates.join(', ')}`);
  } else {
    figma.notify('No duplicates found');
  }
  
}

/*
 * Debug action - Scan for layers that both have a stroke and a fill
 */

// Array to hold the names of layers that meet the criteria
let layersWithStrokeAndFill = [];

// Function to recursively scan all layers within a given layer for stroke and fill
function scanLayersForStrokeAndFill(layer, parentHierarchy = "") {
  // If the layer has children, check each child
  if ("children" in layer) {
    for (const child of layer.children) {
      // Prepare a string representing the current hierarchy of layer names
      const currentHierarchy = parentHierarchy + layer.name + ' > ';
      // Check if the child layer has both a stroke and a fill
      if (child.strokes && child.strokes.length > 0 && child.fills && child.fills.length > 0) {
        // Add the child layer's name and its parent hierarchy to the array
        layersWithStrokeAndFill.push(currentHierarchy + child.name);
      }
      // Recursively check the child layer's children
      scanLayersForStrokeAndFill(child, currentHierarchy);
    }
  }
}

// Function to initiate the scan either on a specified frame or the current selection
function reportFillAndStroke(frame) {
  // Reset the array for each new scan
  layersWithStrokeAndFill = [];

  // If no frame is specified, use the current selection
  if (!frame) {
    const selection = figma.currentPage.selection;
    if (selection.length !== 1 || selection[0].type !== 'FRAME') {
      figma.notify('Please select an autolayout frame that contains icons.');
      return;
    }
    frame = selection[0];
  }

  // Start the recursive scan from the specified frame
  scanLayersForStrokeAndFill(frame);

  // Report the results to the user
  if (layersWithStrokeAndFill.length > 0) {
    const layerNames = layersWithStrokeAndFill.join('\n');
    
    figma.notify(`Layers with both stroke and fill:\n${layerNames}`);

  } else {
    figma.notify('No layers with both stroke and fill found.');
  }
}


/*
 * Action - Remove all top level text layers
 */

function removeAllTopLevelTextLayers() {
    console.log('Starting removeAllTopLevelTextLayers');

    const selection = figma.currentPage.selection;

    if (selection.length !== 1 || selection[0].type !== 'FRAME') {
        console.error('Invalid selection');
        figma.notify('Please select a single frame');
        return;
    }

    const frame = selection[0];
    console.log(`Processing frame: ${frame.name}`);

    let removedCount = 0;

    // Iterate through the direct children of the frame
    for (let i = frame.children.length - 1; i >= 0; i--) {
        const child = frame.children[i];
        if (child.type === "TEXT") {
            console.log(`Removing text layer: ${child.name}`);
            child.remove();
            removedCount++;
        }
    }

    console.log(`Finished removeAllTopLevelTextLayers. Removed ${removedCount} text layers.`);
    figma.notify(`Removed ${removedCount} top-level text layer${removedCount !== 1 ? 's' : ''}`);
}


/*
 * Action - Remove all bitmap images
 */

function removeAllBitmapImages() {
    console.log('Starting removeLayersWithBitmapFills');

    const selection = figma.currentPage.selection;

    if (selection.length !== 1 || selection[0].type !== 'FRAME') {
        console.error('Invalid selection');
        figma.notify('Please select a single frame');
        return;
    }

    const frame = selection[0];
    let removedCount = 0;

    function processNode(node) {
        if ("children" in node) {
            // Process children in reverse order to avoid indexing issues when removing nodes
            for (let i = node.children.length - 1; i >= 0; i--) {
                processNode(node.children[i]);
            }
        }

        if ("fills" in node) {
            const hasBitmapFill = node.fills.some(fill => fill.type === "IMAGE");
            if (hasBitmapFill) {
                console.log(`Removing node with bitmap fill: ${node.name}`);
                node.remove();
                removedCount++;
            }
        }
    }

    processNode(frame);

    console.log(`Finished removeLayersWithBitmapFills. Removed ${removedCount} layers with bitmap fills.`);
    figma.notify(`Removed ${removedCount} layer${removedCount !== 1 ? 's' : ''} with bitmap fill${removedCount !== 1 ? 's' : ''}`);
}


/*
 * Action - Set all children's constraints to scale
 */

function setConstraintsScale(selection = figma.currentPage.selection) {
    console.log('Starting setConstraintsScale');

    if (!selection || selection.length === 0) {
        console.error('No selection provided');
        figma.notify('Error: No layers selected');
        return;
    }

    let count = 0;

    function processNode(node) {
        console.log(`Processing node: ${node.name}, type: ${node.type}`);

        // Skip component instances
        if (node.type === 'INSTANCE') {
            console.log(`Skipping component instance: ${node.name}`);
            return;
        }

        if ('constraints' in node) {
            node.constraints = {
                horizontal: 'SCALE',
                vertical: 'SCALE'
            };
            count++;
            console.log(`Set constraints to SCALE for: ${node.name}`);
        }

        if ('children' in node) {
            console.log(`Node ${node.name} has ${node.children.length} children`);
            for (const child of node.children) {
                processNode(child);
            }
        }
    }

    for (const node of selection) {
        processNode(node);
    }

    console.log(`Finished setConstraintsScale. Updated ${count} nodes.`);
    figma.notify(`Updated constraints for ${count} layers`);
}


/*
 * Action - Create design copy
 */

// 1. Select the frame called “Obra Icons - Original source”. Make a copy.
// 2. Position the copy to the right of the initial frame, with 96px in between the original and the copy.
// 3. Rename the frame to “Obra Icons - Design export”
// 4. Apply “harmonize strokes and fills” code, which harmonizes strokes and fills based on specific layer names
// 5. Apply the “delete keyshapes” code, which removes a layer with a specific name.

function createDesignCopy() {

  loadFonts().then(() => {

    // Get the current page
    const currentPage = figma.currentPage;
  
    // Find the original frame by name on the current page
    const originalFrame = currentPage.findOne(node => node.name === "Obra Icons - Original source" && node.type === "FRAME");

    // Ensure the original frame was found
    if (!originalFrame) {
      figma.notify('Original frame not found');
      figma.closePlugin();
      return;
    }
    
    // Clone the original frame
    const cloneFrame = originalFrame.clone();

    // Position the clone to the left of the original, with 1500px offset
    cloneFrame.x = originalFrame.x + originalFrame.width - 1500;

    // Rename the cloned frame
    cloneFrame.name = "Obra Icons - Design export";

    // Find the frame named "Icons" within the cloned frame
    const iconsFrame = cloneFrame.findOne(node => node.name === "Icons" && node.type === "FRAME");

    // Ensure the Icons frame was found
    if (!iconsFrame) {
      figma.notify('Icons frame not found');
      figma.closePlugin();
      return;
    }

    // Call harmonizeStrokesAndFills with the Icons frame as an argument
    harmonizeStrokesAndFills(iconsFrame);

    // Call deleteKeyShapes with the Icons frame as an argument
    deleteKeyShapes(iconsFrame);

   });

}

/*
 * Action - Create dev copy
 */

// 1. Select the frame called “Obra Icons - Original source”. Make a copy.
// 2. Position the copy to the right of the initial frame, with 96px in between the original and the copy.
// 3. Rename the frame to “Obra Icons - Dev export”
// 4. Within the new frame, find the layer that has the text “Source version”. Rename it to “Dev version”.
// 5. Find the frame called “Icons”. Remove the child layers that are of type text 
// 6. Select the icons layer, and apply merge auto layout groups.
// 7. Apply “harmonize strokes and fills” code, which harmonizes strokes and fills based on specific layer names
// 8. Apply the “delete keyshapes” code, which removes a layer with a specific name.
// 9. Change the layer with contents “Source version” to contain the id of the layer with name “Base” which is to be used in furhter development. The “Base” layer is a direct child of the “Icons” layer.

function createDevCopy() {

  loadFonts().then(() => {

    // Get the current page
    const currentPage = figma.currentPage;
  
    // Find the original frame by name on the current page
    const originalFrame = currentPage.findOne(node => node.name === "Obra Icons - Original source" && node.type === "FRAME");

    // Ensure the original frame was found
    if (!originalFrame) {
      figma.notify('Original frame not found');
      figma.closePlugin();
      return;
    }

    // Clone the original frame
    const cloneFrame = originalFrame.clone();

    // Position the clone to the right of the original, with 96px spacing
    cloneFrame.x = originalFrame.x + originalFrame.width + 96;

    // Rename the cloned frame
    cloneFrame.name = "Obra Icons - Dev export";

    // Find the frame named "Icons" within the cloned frame
    const iconsFrame = cloneFrame.findOne(node => node.name === "Icons" && node.type === "FRAME");

    // Ensure the Icons frame was found
    if (!iconsFrame) {
      figma.notify('Icons frame not found');
      figma.closePlugin();
      return;
    }

    // Iterate through the direct children of the Icons frame and remove children that are text layers
    for (let i = iconsFrame.children.length - 1; i >= 0; i--) {
      const child = iconsFrame.children[i];
      if (child.type === "TEXT") {
        child.remove();
      }
    }

    // Call mergeAutoLayoutGroups with the Icons frame as an argument
    mergeAutoLayoutGroups(iconsFrame);

    // Call harmonizeStrokesAndFills with the Icons frame as an argument
    harmonizeStrokesAndFills(iconsFrame);

    // Call deleteKeyShapes with the Icons frame as an argument
    deleteKeyShapes(iconsFrame);

    // Add the clone to the same parent as the original
    originalFrame.parent.appendChild(cloneFrame);

    // Locate the layer with content "Source version"
    const sourceVersionLayer = cloneFrame.findOne(node => node.type === "TEXT" && node.characters === "Source version");

    // Ensure the Source Version layer was found
    if (!sourceVersionLayer) {
      figma.notify('Source Version layer not found');
      figma.closePlugin();
      return;
    } else {
      console.log('Source Version layer found');
    }

    // Locate the "Base" layer which is a direct child of the "Icons" layer
    const baseLayer = cloneFrame.findOne(node => node.name === "Base");

    // Ensure the Base layer was found
    if (!baseLayer) {
      figma.notify('Base layer not found');
      figma.closePlugin();
      return;
    } else {
      console.log(`Base layer found. Id is ${baseLayer.id}`);
    }

    // Update the text content of the Source Version layer with the id of the Base layer
    sourceVersionLayer.characters = `Dev version - ID: ${baseLayer.id}`;
   });
}

/*
 * Action - Merge auto layout groups
 * @description Merges several auto layout groups that are children of the selected or passed frame
 */

function mergeAutoLayoutGroups(frame = figma.currentPage.selection[0]) {

    const autoLayoutGroups = frame.children.filter(node => node.type === 'FRAME');

    // Ensure there's at least one Auto Layout group to serve as the target
    if (autoLayoutGroups.length === 0) {
        figma.notify('No Auto Layout groups found.');
        return;
    }

    const targetGroup = autoLayoutGroups[0];

    // Iterate through the other Auto Layout groups and move their children to the target group
    for (let i = 1; i < autoLayoutGroups.length; i++) {
        let group = autoLayoutGroups[i];
        for (let child of group.children) {
            targetGroup.appendChild(child.clone());
        }
    }

    // Delete the other Auto Layout groups
    for (let i = 1; i < autoLayoutGroups.length; i++) {
        autoLayoutGroups[i].remove();
    }

    // Notify the user of completion
    figma.notify('Auto Layout groups merged successfully.');
}



/*
 * Action - Harmonize strokes and fills
 * @description Set the stroke and fill of icons to black, instead of the specific variable name used in production
 */

function harmonizeStrokesAndFills(frame = figma.currentPage.selection[0]) {

    if (!frame) {
        console.error('No frame provided or selected');
        figma.notify('Error: No frame provided or selected');
        return;
    }

    console.log(`Frame type: ${frame.type}, name: ${frame.name}`);

    // Check if the frame is actually a selection of multiple items
    if (Array.isArray(figma.currentPage.selection) && figma.currentPage.selection.length > 1) {
        figma.currentPage.selection.forEach((item, index) => {
            console.log(`Processing selection item ${index + 1}:`, item);
            harmonizeOperations(item);
        });
    } else {
        console.log('Single frame or item, processing normally');
        harmonizeOperations(frame);
    }

}

function harmonizeOperations(node) {
    setColors(node);

    if ("children" in node) {
        for (const child of node.children) {
            harmonizeOperations(child);
        }
    }
}

function setColors(node) {

    if (
        (
            node.type === "VECTOR" ||
            node.type === "ELLIPSE" ||
            node.type === "RECTANGLE" ||
            node.type === "STAR"
        ) && node.name != "oi-fill"
    ) {
        node.strokes = [{ type: "SOLID", color: {r: 0, g: 0, b: 0} }];
    }

    if (
        node.name === "oi-fill" &&
        (
            node.type === "VECTOR" ||
            node.type === "ELLIPSE" ||
            node.type === "STAR" ||
            node.type === "RECTANGLE" ||
            node.type === "BOOLEAN_OPERATION"
        )
    )  {
        if (node.fills.length > 0) {
            node.fills = [{ type: "SOLID", color: {r: 0, g: 0, b: 0} }];
        } else {
            console.log(`Node ${node.name} has no fills`);
        }
    }
}

/*
 * Action - Remove key shape layers
 */
let nodesToRemove = [];  // Array to hold nodes that will be removed

function deleteKeyShapes(selectionOrFrame = figma.currentPage.selection) {
    console.log('Starting deleteKeyShapes');

    // Reset nodesToRemove array
    nodesToRemove = [];

    if (!selectionOrFrame || (Array.isArray(selectionOrFrame) && selectionOrFrame.length === 0)) {
        console.error('No selection or frame provided');
        figma.notify('Please select at least one item');
        return;
    }

    // If a single frame is passed (like in createDevCopy), wrap it in an array
    const itemsToProcess = Array.isArray(selectionOrFrame) ? selectionOrFrame : [selectionOrFrame];

    // Process each item
    itemsToProcess.forEach(item => {
        console.log(`Processing item: ${item.name}, type: ${item.type}`);
        markForRemoval(item);
    });

    // Now remove all nodes marked for removal
    let removedCount = nodesToRemove.length;
    nodesToRemove.forEach(node => {
        console.log(`Removing node: ${node.name}`);
        node.remove();
    });

    console.log(`Finished deleteKeyShapes. Removed ${removedCount} key shape(s).`);
    if (figma.currentPage.selection.length > 0) {
        // Only notify if it's being run independently (not as part of createDevCopy)
        figma.notify(`${removedCount} key shape${removedCount !== 1 ? 's' : ''} removed`);
    }
    return removedCount;  // Return the count for use in createDevCopy
}

// Recursive function to mark layers named "Key shape template" for removal
function markForRemoval(node) {
    if (node.name === "Key shape template") {
        console.log(`Marking for removal: ${node.name}`);
        nodesToRemove.push(node);
    }

    // If the node has children, recurse through them
    if ("children" in node) {
        node.children.forEach(child => {
            markForRemoval(child);
        });
    }
}

/*
 * Action - Stroke weight to one
 */

function setStrokeWeightToOne(selection = figma.currentPage.selection) {
    console.log('Starting setStrokeWeightToOne');

    if (!selection || selection.length === 0) {
        console.error('No selection provided');
        figma.notify('Error: No layers selected');
        return;
    }

    let count = 0;

    function processNode(node) {
        console.log(`Processing node: ${node.name}, type: ${node.type}`);

        if (node.name === "Key shape template") {
            console.log(`Skipping Key shape template: ${node.name}`);
            return;
        }

        if ('strokes' in node && node.strokes.length > 0) {
            node.strokeWeight = 1;
            count++;
            console.log(`Set stroke weight to 1px for: ${node.name}`);
        }

        if ('children' in node) {
            console.log(`Node ${node.name} has ${node.children.length} children`);
            for (const child of node.children) {
                processNode(child);
            }
        }
    }

    for (const node of selection) {
        processNode(node);
    }

    console.log(`Finished setStrokeWeightToOne. Updated ${count} nodes.`);
    figma.notify(`Updated stroke weight for ${count} layer${count !== 1 ? 's' : ''}`);
}

/*
 * Action - Auto colour named layers with same name variables
 */

const colorVariableNames = [
    'oi-line',
    'oi-ellipse',
    'oi-box',
    'oi-incomplete-triangle',
    'oi-vector',
    'oi-fill',
    'oi-triangle',
    'oi-mini-dot',
    'oi-medium-dot',
    'oi-mini-square',
    'oi-medium-square',
    'oi-dot'
];

function autoColourNamedLayers() {
    const selection = figma.currentPage.selection;

    // Get all local variables
    const localVariableCollections = figma.variables.getLocalVariableCollections();

    // Find our color variables
    const colorVariables = localVariableCollections.flatMap(collection =>
        collection.variableIds.map(id => figma.variables.getVariableById(id))
    ).filter(variable =>
        variable !== null && colorVariableNames.includes(variable.name)
    );

    let appliedCount = 0;

    function processNode(node) {
        if ('name' in node) {
            const matchingVariable = colorVariables.find(variable => variable.name === node.name);

            if (matchingVariable) {
                if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
                    // For fills
                    const fills = clone(node.fills);
                    fills[0] = figma.variables.setBoundVariableForPaint(fills[0], 'color', matchingVariable);
                    node.fills = fills;
                    appliedCount++;
                }
                if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
                    // For strokes
                    const strokes = clone(node.strokes);
                    strokes[0] = figma.variables.setBoundVariableForPaint(strokes[0], 'color', matchingVariable);
                    node.strokes = strokes;
                    appliedCount++;
                }
            }
        }

        // Recursively process children if the node is a container (like a frame or group)
        if ('children' in node) {
            for (const child of node.children) {
                processNode(child);
            }
        }
    }

    // Process each selected node
    selection.forEach(processNode);

    figma.notify(`Applied colors to ${appliedCount} property${appliedCount !== 1 ? 'ies' : 'y'}`);
}


function clone(val) {
    return JSON.parse(JSON.stringify(val));
}
