import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $createTextNode, $getSelection, $isRangeSelection, $setSelection, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_LOW, DELETE_CHARACTER_COMMAND, DELETE_LINE_COMMAND, DELETE_WORD_COMMAND, KEY_BACKSPACE_COMMAND, KEY_DELETE_COMMAND, KEY_DOWN_COMMAND, LexicalNode, RangeSelection } from "lexical";
import { $createInsertNode } from "../nodes/InsertNode";
import { $createDeleteNode } from "../nodes/DeleteNode";


let username = "user1";

/**
* Merge all delete nodes that are next to each other
* 
* @param {RangeSelection} selection - Current selection
* 
*/
function mergeDelete(selection: RangeSelection){
    let selectedNodes = selection.getNodes();
    // merge all the delete nodes that are next to each other within the nodes that are currently selected
    for(let currentNode of selectedNodes){
        if(currentNode.__type == "paragraph"){
            continue;
        }
        let mainNode = currentNode.getTopLevelElement();
        let childNodes = mainNode?.getChildren() ?? [];
        let prevNode = null;
        let mergedDeleteNodes = [];
        let mergedNode = null;
        for(let node of childNodes){

            if(node.__type == 'delete' && prevNode == null){
                prevNode = node;
                if(mergedNode){
                    mergedDeleteNodes.push(mergedNode)
                    mergedNode = null;
                }
                continue;
            }
            if(node.__type == "delete" && prevNode !== null){
                let prevChildNodes = (prevNode as any).getChildren();
                let currentChildNodes = (node as any).getChildren();
                let newChildNodes = [...prevChildNodes, ...currentChildNodes]
                let newDeleteNode = $createDeleteNode(username);
                newDeleteNode.append(...newChildNodes);
                node.insertBefore(newDeleteNode);
                node.remove();
                prevNode.remove();
                prevNode = newDeleteNode;
                mergedNode = newDeleteNode;
            }else{
                prevNode = null;
                if(mergedNode){
                    mergedDeleteNodes.push(mergedNode);
                    mergedNode = null;
                }
            }
        }
    }

}

/**
* Handles the selection when multiple nodes are selected.
* 
* @param {LexicalNode} node - The node that was selected.
* @param {number} offset - anchor offset / focus offset value.
* @param {string} selectedArea - Left or Right half that was selected.
* 
*/
function handleMultiNodeSplit(node: any, offset: number, selectedArea: string){
    
    const parentNode = node.getParent();

    if (parentNode && parentNode.__type === "insert") {
      if(offset === -1){ // when the full node is selected
        node.remove();
        return;
      }
      let parentInsertNode: any = node.getParent();
      let split_nodes: [Text, Text] | any  = null;
     
      let newParaNode = $createParagraphNode();
      newParaNode.append(node);
      split_nodes = node.splitText(...[offset]);
      // depending on which half was selected split the node accordingly
      if(selectedArea == "left"){
        if(offset === 0){
          parentInsertNode.append(node);
        //   $setSelection(node.select(0, 0));
          return [node];
        }else if(node.__text.length === offset){
          split_nodes[0].remove();
          let newTextNode = $createTextNode("")
          parentInsertNode.append(newTextNode)
          return newTextNode;
        }else{
          split_nodes[0].remove();
          parentInsertNode.append(split_nodes[1]);
        //   $setSelection(split_nodes[1].select(0, 0));
          return [split_nodes[1]]; // if a node is returned within an area it means that this particular node has to be selected and the pointer must be kept at position (0, 0) to handle edge cases
        }
      }else{
        if(offset === 0 ){
          split_nodes[0].remove();
          let newTextNode = $createTextNode("")
          parentInsertNode.append(newTextNode)
          return newTextNode;
        }else if(node.__text.length === offset){
          parentInsertNode.append(node);
          return node;
        }else{
          split_nodes[1].remove();
          parentInsertNode.append(split_nodes[0]);
          return split_nodes[0];
        }
      }

    }
    // splitting delete nodes
    if(node.getParent().__type === "delete"){
      if(offset === -1){ // when the full node is selected
        return;
      }
      if(selectedArea === "right"){
        return node;
      }else{
        // $setSelection(node.select(0,0));
        return [node];
      }
      
    }

    // case when the selected node is a text node of a paragraph node (pre-existing text case)
    let delNode = $createDeleteNode(username);
    node.insertBefore(delNode);
    
    if(offset === -1){
      delNode.append(node);
      return;
    }

    let split_nodes = null;
    let newParaNode = $createParagraphNode();
    newParaNode.append(node);
    split_nodes = node.splitText(...[offset]);
    if(selectedArea == "left"){  // if the cursor has selected the left half
      if(offset == 0){
        delNode.insertBefore(split_nodes[0]);
        delNode.remove();
      }else if(node.__text.length === offset){
        delNode.append(split_nodes[0]);
      }else{
        delNode.append(split_nodes[0]);
        delNode.insertAfter(split_nodes[1]);
      }
    }else{ // if the cursor has selected the right half
      if(offset == 0){
        delNode.append(split_nodes[0]);
      }else if(node.__text.length === offset){
        delNode.insertAfter(split_nodes[0]);
        delNode.remove();
      }else{
        delNode.append(split_nodes[1]);
        delNode.insertBefore(split_nodes[0]);
      }
    }

    return split_nodes[0];

}

/**
* Handles the selection within a single node.
* 
* @param {LexicalNode} node - The node that was selected.
* @param {number} anchorOffset - anchor offset value
* @param {number} focusOffset - focus offset value
* @param {string | null} data - The data to be inserted
*/
function handleSingleNodeSplit(node: any, anchorOffset: number, focusOffset: number, data: string|null){
    let selectedArea = "left";
    const parentNode = node.getParent();
    // logic for deciding which half was selected within the node
    if(anchorOffset < focusOffset){
        selectedArea = "right";
    }

    if(anchorOffset == node.getTextContent().length){
        selectedArea = "right";
    }else if(anchorOffset == 0){
        selectedArea = "left"
    }
    // splitting the different types of nodes accordingly
    if(parentNode && parentNode.__type == "delete"){
        node.select();
    }
    // all insert based nodes that were selected have to be removed
    else if(parentNode && parentNode.__type == "insert"){
        let parentInsertNode: LexicalNode | any = node.getParent();
        let newParaNode = $createParagraphNode();
        newParaNode.append(node);
        let splitNodes = node.splitText(...[anchorOffset, focusOffset]);
        if(splitNodes.length == 1){
            let parentParaNode = parentInsertNode.getParent();
            parentInsertNode.remove();
            parentParaNode.select();
        }else if (splitNodes.length == 2){
            if(selectedArea == "left"){
                splitNodes[0].remove();
                parentInsertNode.append(splitNodes[1]);
                splitNodes[1].select(0,0);
            }else{
                splitNodes[1];
                parentInsertNode.append(splitNodes[0]);
                splitNodes[0].select();
            }
        }else{
            splitNodes[1].remove();
            let selectedOffset = splitNodes[0].getTextContent().length;
            let newTextNode = $createTextNode(splitNodes[0].getTextContent()+splitNodes[2].getTextContent());
            parentInsertNode.append(newTextNode);
            newTextNode.select(selectedOffset, selectedOffset);
        }
    }
    // all other nodes that are not insert or delete must be wrapped within a delete node
    else{
        let delNode = $createDeleteNode(username);
        node.insertBefore(delNode);
        let newParaNode = $createParagraphNode();
        newParaNode.append(node);
        let splitNodes = node.splitText(...[anchorOffset, focusOffset]);
        if(splitNodes.length == 1){
            delNode.append(splitNodes[0]);
            delNode.select();
        }else if(splitNodes.length == 2){
            if(selectedArea == "left"){
                delNode.append(splitNodes[0]);
                delNode.insertAfter(splitNodes[1]);
                delNode.select()
            }else{
                delNode.append(splitNodes[1]);
                delNode.insertBefore(splitNodes[0]);
                splitNodes[0].select()
            }
        }else{
            delNode.append(splitNodes[1]);
            delNode.insertBefore(splitNodes[0]);
            delNode.insertAfter(splitNodes[2]);
            if(selectedArea == "left"){
                splitNodes[0].select();
            }else{
                delNode.select();
            }
        }
    }
    // if there is data it must be inserted at the selected focus offset
    if(data){
        handleInsert(data);
    }
}

/**
* Handles the selection and insertion or deletion of data.
* 
* @param {string | null} data - The data to be inserted.
*/
export function handleSelection(data: string | null){

    let selection = $getSelection(); // get the current selection

    let selectionCopy = selection?.clone();
    if($isRangeSelection(selection)){
        // get all the nodes that are selected along with the focus and anchor details
        let selectedNodes = selection.getNodes();
        let anchorOffset = selection.anchor.offset;
        let focusOffset = selection.focus.offset;
        let anchorKey = selection.anchor.key;
        let focusKey = selection.focus.key;

        // when a user tries to select within a single node
        if(selectedNodes.length == 1){
            let node = selectedNodes[0];
            handleSingleNodeSplit(node, anchorOffset, focusOffset, data)     
        }else{
            // setting the selected area, when the users selects from bottom to top or vice-versa the selection area differs
            let anchor = false;
            for(let node of selectedNodes){
                if(node.__key == anchorKey){
                  anchor = true;
                  break
                }
            
                if(node.__key == focusKey){
                  break;
                }
            }
        
            let anchorSelectedArea = "left";
            let focusSelectedArea = "right"
        
            if(anchor){
              anchorSelectedArea = "right";
              focusSelectedArea = "left";
            }
            // for selection based insertion or deletion the node where the anchor node or focus node points to must be split and wrapped accordingly all other nodes can be wrapped within the delete node provide it is not already a delete node
            for(let node of selectedNodes){
                if(node.__type === "text" && node.__key === anchorKey){ //splitting anchor node
                  handleMultiNodeSplit(node, anchorOffset, anchorSelectedArea);
                }else if(node.__type === "text" && node.__key === focusKey){ //splitting focus node and inserting the data if its not null
                  let split_node = handleMultiNodeSplit(node, focusOffset, focusSelectedArea)
                  if(Array.isArray(split_node)){
                    $setSelection(split_node[0].select(0,0))
                  }else{
                    $setSelection(split_node.select());
                  }

                  if( data ){ 
                    handleInsert(data);
                  }
                }else if(node.__type === "text"){ // all other nodes that were fully selected
                    handleMultiNodeSplit(node, -1, anchorSelectedArea)
                }
            }

        }

        if($isRangeSelection(selectionCopy)){
            mergeDelete(selectionCopy)
        }

    }

    return true;
}


/**
* Handles the insertion of data.
* 
* @param {string} data - The data to be inserted.
*/
function handleInsert(data: string){
    let selection = $getSelection(); // get the current selection
    if($isRangeSelection(selection)){
        let currentNode: LexicalNode | any = selection.getNodes()[0];
        // get the node that is selected along with the anchor and focus details
        let anchorKey = selection.anchor.key;
        let focusKey = selection.focus.key;
        let anchorOffset = selection.anchor.offset;
        let focusOffset = selection.focus.offset;
        // if the anchor and focus offset are different it generally means that a bunch of content was selected
        if(anchorOffset !== focusOffset){ 
            return handleSelection(data);
        }
        // edge case when the anchor and focus offset are same but the keys are different, it still means that a bunch of paragraphs were selected.
        if(anchorOffset == focusOffset && anchorKey !== focusKey){
            return handleSelection(data);
        }
        if(currentNode.__type =="root"){
            selection.insertNodes([$createParagraphNode(), $createInsertNode(username)]);
            selection.insertText(data);
            return true;
         }
        // inserting data within a insert node
        if(currentNode.getParent().__type == "insert"){
            let insertNode = currentNode.getParent();
            if(insertNode.__username == username){
                selection.insertText(data); 
                insertNode.setNewDate()
            }else{
                let newInsertNode = $createInsertNode(username);
                insertNode.insertAfter(newInsertNode)
                let splitNodes = currentNode.splitText(anchorOffset);
                insertNode.append(splitNodes[0]);
                if(splitNodes.length !== 1){
                    let oldInsertNode = $createInsertNode(insertNode.__username);
                    newInsertNode.insertAfter(oldInsertNode);
                    oldInsertNode.append(splitNodes[1]);
                }
                let textNode = $createTextNode("");
                newInsertNode.append(textNode)
                textNode.select().insertText(data);
            }
        }
        // inserting data within a delete node
        else if(currentNode.getParent().__type == "delete"){
            let insertNode = $createInsertNode(username);
            insertNode.append($createTextNode(data))
            currentNode.getParent().insertAfter(insertNode);
            $setSelection(insertNode.select());
            
        }
        // inserting data within any other node
        else{
            let insertNode = $createInsertNode(username);
            selection.insertNodes([insertNode]);
            selection.insertText(data);
        }

    }

    return true;
}


/**
* Handles the deletion of data.
*/
function handleDelete(){
    let selection = $getSelection(); // get the current selection
    if($isRangeSelection(selection)){
        // get the anchor and focus details
        let anchorOffset = selection.anchor.offset;
        let focusOffset = selection.focus.offset;
        let anchorKey = selection.anchor.key;
        let focusKey = selection.focus.key;
        // if the anchor and focus offset are different it generally means that a bunch of content was selected
        if(anchorOffset !== focusOffset){
            return handleSelection(null);
        }

        // edge case when the anchor and focus offset are same but the keys are different, it still means that a bunch of paragraphs were selected.   
        if(anchorOffset == focusOffset && anchorKey !== focusKey){
            return handleSelection(null);
        }
        let currentNode: LexicalNode | any = selection.getNodes()[0];

        // when the user tries to delete inner level blocks within paragraphs like span tags and other nodes
        if(anchorOffset == 0 && currentNode.getParent().__type != "paragraph"){
            while(currentNode.__type != "paragraph"){ // some condition
                let prevSibling = currentNode.getPreviousSibling();
                if(prevSibling){
                    prevSibling.select();
                    handleDelete();
                    return true;
                }else{
                    let parentNode = currentNode.getParent();
                    if(parentNode.getTextContent() == currentNode.getTextContent()){
                        //mark as delete
                    }
                    currentNode = parentNode;
                }
            }
            
            let previousSibling = currentNode.getPreviousSibling();
            if(previousSibling){
                let descendant = previousSibling.getLastDescendant();
                if(descendant){
                    descendant.select();
                }else{
                    previousSibling.select();
                }
            }
            
            return true;
        }
        // when the user tries to delete a paragraph
        if(anchorOffset == 0 && currentNode.getParent().__type == "paragraph"){
            let paraNode = currentNode.getParent();
            let previousSibling = paraNode.getPreviousSibling();
            if(previousSibling){
                let descendant = previousSibling.getLastDescendant();
                if(descendant){
                    descendant.select();
                }else{
                    previousSibling.select();
                }

            }

            return true;
        }
        
        
        // logic for deleting a insert node
        if(currentNode.getParent().__type == "insert"){
            let parentInsertNode = currentNode.getParent();
            // when the user tries to delete the content from the end or a single character content
            if(anchorOffset == currentNode.getTextContent().length){
                let paraNode = $createParagraphNode();
                paraNode.append(currentNode);
                let splitNodes = currentNode.splitText(...[anchorOffset-1]);
                if(splitNodes.length ==1){
                    let prevSibling = parentInsertNode.getPreviousSibling();
                    if(prevSibling){
                        parentInsertNode.remove();
                        prevSibling.select();
                    }else{
                        let parentParaNode = parentInsertNode.getParent();
                        parentInsertNode.remove();
                        parentParaNode.select();
                    }
                }else{
                    parentInsertNode.append(splitNodes[0]);
                    splitNodes[1].remove();
                    splitNodes[0].select()
                }
            }
            // when the user tries to delete a content within the middle
            else{
                let paraNode = $createParagraphNode();
                paraNode.append(currentNode);
                let splitNodes = currentNode.splitText(...[anchorOffset-1, anchorOffset]);
                console.log(splitNodes)
                if(splitNodes.length == 2){
                    splitNodes[0].remove();
                    parentInsertNode.append(splitNodes[1]);
                    let prevSibling = parentInsertNode.getPreviousSibling();
                    if(prevSibling){
                        prevSibling.select();
                    }else{
                        splitNodes[1].select(0,0)
                    }
                }else{
                    let offset = splitNodes[0].getTextContent().length;
                    let textNode = $createTextNode(splitNodes[0].getTextContent()+splitNodes[1].getTextContent());
                    parentInsertNode.append(textNode);
                    textNode.select(offset, offset);
                }
            }
            // merging all the delete nodes to avoid duplicates
            mergeDelete(selection)
            return true;
        }

        // when the user tries to delete a delete node
        if(currentNode.getParent().__type == "delete"){
            let parentDeleteNode = currentNode.getParent();
            let prevSibling = parentDeleteNode.getPreviousSibling();
            if(prevSibling){
                prevSibling.select();
                return true;
            }
            currentNode.getParent().select(0,0);
            mergeDelete(selection)
            return true;
        }

        // when to user tries to delete any other node
        // Removing content from the end of a string or deleting a single character from the content.
        if(anchorOffset == currentNode.getTextContent().length){
            let deleteNode = $createDeleteNode(username);
            currentNode.insertAfter(deleteNode);
            let paraNode = $createParagraphNode();
            paraNode.append(currentNode);
            let splitNodes = currentNode.splitText(...[anchorOffset-1]);
            if(splitNodes.length ==1){
                deleteNode.append(splitNodes[0])
                splitNodes[0].select(0,0)
            }else{
                deleteNode.insertBefore(splitNodes[0]);
                deleteNode.append(splitNodes[1]);
                splitNodes[0].select()
            }
        }
        // Removing the content from the middle
        else{
            let deleteNode = $createDeleteNode(username);
            currentNode.insertAfter(deleteNode);
            let paraNode = $createParagraphNode();
            paraNode.append(currentNode);
            let splitNodes = currentNode.splitText(...[anchorOffset-1, anchorOffset]);
            if(splitNodes.length == 2){
                deleteNode.append(splitNodes[0]);
                deleteNode.insertAfter(splitNodes[1]);
                splitNodes[0].select(0,0)
            }else{
                deleteNode.append(splitNodes[1]);
                deleteNode.insertBefore(splitNodes[0]);
                deleteNode.insertAfter(splitNodes[2]);
                splitNodes[0].select()
            }

        }
        // merging duplicate delete nodes
        mergeDelete(selection)
    }
    return true;
}

export default function TrackChangesPlugin(){

    
    const [editor] = useLexicalComposerContext();

    // Overide any keypress operation 
    editor.registerCommand(KEY_DOWN_COMMAND, (event) => {
        let regex = /^[a-zA-Z0-9\s`~!@#$%^&*()_+={}\[\]:;"'<>,.?/|\\-]$/
        if(!regex.test(event.key)){ // to ignore key press events like Enter, Left Arrow, Right Arrow etc
          return false;
        }
        event.preventDefault();
        return handleInsert(event.key);
    }, COMMAND_PRIORITY_LOW);

    // Override backspace keypress operation
    editor.registerCommand(KEY_BACKSPACE_COMMAND, (event)=>{
        event.preventDefault();
        return handleDelete();
    }, COMMAND_PRIORITY_HIGH)

    // Override delete keypress operation
    editor.registerCommand(KEY_DELETE_COMMAND, (event)=>{
        event.preventDefault();
        return handleDelete();
    }, COMMAND_PRIORITY_HIGH)

    // Override ctrl+backspace operation
    editor.registerCommand(DELETE_LINE_COMMAND, (event) => {
        return handleDelete();
    }, COMMAND_PRIORITY_HIGH)

    // Override shift+delete operation
    editor.registerCommand(DELETE_CHARACTER_COMMAND, (event) => {
        return handleDelete();
    }, COMMAND_PRIORITY_HIGH)

    // Override ctrl+delete operation
    editor.registerCommand(DELETE_WORD_COMMAND, (event) => {
        return handleDelete();
    }, COMMAND_PRIORITY_HIGH)

    return null;
}