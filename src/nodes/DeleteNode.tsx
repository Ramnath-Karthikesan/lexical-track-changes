
'use strict';

import type { DOMExportOutput, EditorConfig, LexicalEditor, NodeKey, SerializedElementNode, Spread} from "lexical";
import { ElementNode, isHTMLElement, $applyNodeReplacement } from "lexical";
import { addClassNamesToElement } from "@lexical/utils";
import { v4 as uuidv4 } from 'uuid';

function formatDate(date: any) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hours = date.getHours() % 12 || 12; // Convert to 12-hour format
    const minutes = date.getMinutes().toString().padStart(2, '0'); // Ensure minutes are always two digits
    const seconds = date.getSeconds().toString().padStart(2, '0'); // Include seconds
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    const formattedDate = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ${hours}:${minutes}:${seconds} ${ampm}`;
    return formattedDate;
  }

/** @module @lexical/link */
/** @noInheritDoc */

export type SerializedDeleteNode = Spread<
  { username: string; id: string; date: string},
  SerializedElementNode
>;

export default class DeleteNode extends ElementNode {

    /** @internal */
    __username: string;
    __id: string;
    __date: string;

    static getType(): string {
        return 'delete';
    }

    static clone(node: DeleteNode): DeleteNode {
        return new DeleteNode(node.__username, node.__id, node.__date, node.__key);
    }

    constructor(username: string, id?: string, date?: string, key?: NodeKey) {
        super(key);
        this.__username = username;
        if (id === null || id === undefined) {
          this.__id = uuidv4();
        } else {
          this.__id = id;
        }

        if(!date){
          this.__date = formatDate(new Date());
        }else{
          this.__date = date
        }
    }

    createDOM(config: EditorConfig): HTMLSpanElement {
        const element = document.createElement('span');
        element.setAttribute("username", this.__username);
        element.setAttribute("id", this.__id);
        element.setAttribute("date", this.__date);
        addClassNamesToElement(element, config.theme.delete);
        return element;
    }

    updateDOM(prevNode: DeleteNode, dom: HTMLElement, config: EditorConfig,): boolean {
        this.__date = formatDate(new Date());
        return true;
    }


    exportDOM(editor: LexicalEditor): DOMExportOutput {
        const { element } = super.exportDOM(editor);

        if (element && isHTMLElement(element)) {
            if (this.isEmpty()) element.append(document.createElement('br'));

            const formatType = this.getFormatType();
            element.style.textAlign = formatType;

            const direction = this.getDirection();
            if (direction) {
                element.dir = direction;
            }
            const indent = this.getIndent();
            if (indent > 0) {
                // padding-inline-start is not widely supported in email HTML, but
                // Lexical Reconciler uses padding-inline-start. Using text-indent instead.
                element.style.textIndent = `${indent * 20}px`;
            }
            element.setAttribute("date", this.__date)
        }

        return {
            element,
        };
    }

    static importJSON(serializedNode: SerializedDeleteNode): DeleteNode {
        const node = $createDeleteNode(serializedNode.username, serializedNode.id, serializedNode.date);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }


    exportJSON() {
        return {
            ...super.exportJSON(),
            type: 'delete'
        };
    }


    canInsertTextBefore() {
        return true;
    }

    canInsertTextAfter() {
        return true;
    }

    canBeEmpty() {
        return false;
    }

    isInline() {
        return true;
    }

    isTextEntity() {
        return true;
    }

}


/**
 * Creates a DeleteNode.
 * @returns DeleteNode.
 */
export function $createDeleteNode(username: string, id?: string, date?: string): DeleteNode {
    return $applyNodeReplacement(new DeleteNode(username, id, date));
}

/**
 * Determines if node is a DeleteNode.
 * @param node - The node to be checked.
 * @returns true if node is a DeleteNode, false otherwise.
 */
export function $isDeleteNode(node: Node) {
    return node instanceof DeleteNode;
}

