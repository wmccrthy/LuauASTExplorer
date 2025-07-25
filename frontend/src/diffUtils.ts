import { diff } from 'json-diff-ts';
import { ASTNode, DiffASTNode, JsonDiffChange } from './typesAndInterfaces';

export function annotateDiffTree(
  beforeAST: ASTNode,
  afterAST: ASTNode
): { diffTree: DiffASTNode; changes: JsonDiffChange[] } {
  
  // Generate diff using json-diff-ts
  const changes = diff(beforeAST, afterAST);
  
  // Convert json-diff-ts format to our JsonDiffChange format (preserving nested structure)
  const formattedChanges: JsonDiffChange[] = changes.map(change => convertNestedChange(change));

  // Create a deep copy of the afterAST as our base tree
  const diffTree = deepClone(afterAST) as DiffASTNode;
  
  // Build a flat map of paths to changes for easier lookup
  const changeMap = new Map<string, JsonDiffChange>();
  buildChangeMap(formattedChanges, '', changeMap);
  
  console.log('Change map paths:', Array.from(changeMap.keys()));
  console.log('Change map entries:', Array.from(changeMap.entries()));

  // Recursively annotate the tree
  annotateDiffTreeRecursive(diffTree, changeMap, beforeAST, '');

  return { diffTree, changes: formattedChanges };
}

/**
 * Converts a nested json-diff-ts change to our format
 */
function convertNestedChange(change: any): JsonDiffChange {
  const converted: JsonDiffChange = {
    type: change.type as 'ADD' | 'REMOVE' | 'UPDATE',
    key: change.key,
    value: change.value,
    oldValue: change.oldValue,
    embeddedKey: change.embeddedKey
  };
  
  if (change.changes && Array.isArray(change.changes)) {
    converted.changes = change.changes.map(convertNestedChange);
  }
  
  return converted;
}

/**
 * Builds a flat map of paths to changes from the nested structure
 */
function buildChangeMap(changes: JsonDiffChange[], parentPath: string, changeMap: Map<string, JsonDiffChange>) {
  changes.forEach(change => {
    const currentPath = parentPath ? `${parentPath}.${change.key}` : change.key;
    
    // If this change has nested changes, recurse deeper and don't add this intermediate node
    if (change.changes && change.changes.length > 0) {
      buildChangeMap(change.changes, currentPath, changeMap);
    } else {
      // Only add leaf changes (changes with actual oldValue/value) to the map
      if (change.oldValue !== undefined || change.value !== undefined) {
        console.log(`Adding leaf change to map: "${currentPath}"`, change);
        changeMap.set(currentPath, change);
      }
    }
  });
}

/**
 * Recursively walks the tree and annotates nodes based on detected changes
 */
function annotateDiffTreeRecursive(
  node: DiffASTNode,
  changeMap: Map<string, JsonDiffChange>,
  beforeNode: any,
  currentPath: string
): void {
  
  // Debug: log what we're checking
  if (currentPath.includes('value') || currentPath.includes('text')) {
    console.log(`Checking path: "${currentPath}"`);
  }
  
  // Check if this exact path has changes
  const change = changeMap.get(currentPath);
  
  if (change) {
    console.log(`Found change for path "${currentPath}":`, change);
  }
  
  if (change) {
    // This is a leaf node with actual changes
    switch (change.type) {
      case 'ADD':
        node.diffStatus = 'added';
        node.afterValue = change.value;
        break;
      case 'REMOVE':
        node.diffStatus = 'removed';
        node.beforeValue = change.oldValue;
        break;
      case 'UPDATE':
        node.diffStatus = 'updated';
        node.beforeValue = change.oldValue;
        node.afterValue = change.value;
        break;
    }
    node.diffKey = change.key;
  } else {
    // Check if any child paths have changes
    const hasChildChanges = Array.from(changeMap.keys()).some(path => 
      path.startsWith(currentPath + '.')
    );
    
    if (hasChildChanges) {
      // Parent node - mark as containing changes but don't set beforeValue/afterValue
      node.diffStatus = 'contains-changes';
    } else {
      node.diffStatus = 'unchanged';
    }
  }

  // Recursively process children
  if (node && typeof node === 'object') {
    Object.keys(node).forEach(key => {
      if (key === 'diffStatus' || key === 'beforeValue' || key === 'afterValue' || key === 'diffKey') {
        return; // Skip our added diff properties
      }

      const childPath = currentPath ? `${currentPath}.${key}` : key;
      const beforeChildNode = beforeNode?.[key];
      
      if (Array.isArray(node[key])) {
        // Handle arrays - use dot notation to match json-diff-ts format
        node[key].forEach((item: any, index: number) => {
          if (item && typeof item === 'object') {
            const arrayPath = `${childPath}.${index}`;
            annotateDiffTreeRecursive(item, changeMap, beforeChildNode?.[index], arrayPath);
          }
        });
      } else if (node[key] && typeof node[key] === 'object') {
        // Handle nested objects
        annotateDiffTreeRecursive(node[key], changeMap, beforeChildNode, childPath);
      }
    });
  }
}

/**
 * Deep clone utility function
 */
function deepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned: any = {};
  Object.keys(obj).forEach(key => {
    cloned[key] = deepClone(obj[key]);
  });
  
  return cloned;
}

/**
 * Generate a human-readable description of a change
 */
export function getChangeDescription(change: JsonDiffChange): string {
  switch (change.type) {
    case 'ADD':
      return `Added: ${change.value}`;
    case 'REMOVE':
      return `Removed: ${change.oldValue}`;
    case 'UPDATE':
      return `Changed: ${change.oldValue} → ${change.value}`;
    default:
      return 'Unknown change';
  }
} 