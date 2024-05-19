
"use strict";

import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedElementNode,
  Spread,
} from "lexical";
import {
  ElementNode,
  isHTMLElement,
  $applyNodeReplacement,
} from "lexical";
import { addClassNamesToElement } from "@lexical/utils";
import { $createDeleteNode } from "./DeleteNode";
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

export type SerializedInsertNode = Spread<
  { username: string; id: string; date: string},
  SerializedElementNode
>;

export default class InsertNode extends ElementNode {
  /** @internal */
  __username: string;
  __id: string;
  __date: string;

  static getType(): string {
    return "insert";
  }

  static clone(node: InsertNode): InsertNode {
    return new InsertNode(node.__username, node.__id, node.__date, node.__key);
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
    const element = document.createElement("span");
    element.setAttribute("username", this.__username);
    element.setAttribute("id", this.__id);
    element.setAttribute("date", this.__date);
    addClassNamesToElement(element, config.theme.insert);
    return element;
  }

  updateDOM(
    prevNode: InsertNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    const writeSelf = this.getWritable();
    writeSelf.__date = formatDate(new Date());
    return true;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (node: Node) => ({
        conversion: convertSpanElement,
        priority: 1,
      }),
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);

    if (element && isHTMLElement(element)) {
      if (this.isEmpty()) element.append(document.createElement("br"));

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

  static importJSON(serializedNode: SerializedInsertNode): InsertNode {
    const node = $createInsertNode(serializedNode.username, serializedNode.id, serializedNode.date);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: "insert",
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
  setNewDate(){
    const writeSelf = this.getWritable();
    writeSelf.__date = formatDate(new Date());
  }

}

function convertSpanElement(domNode: Node) {
    let node = null;
    if (isHTMLElement(domNode)) {
        const content = domNode.textContent;
        const className = domNode.getAttribute("class")
        if (content !== null && content !== '' && className?.includes("editor-insert")) {
            node = $createInsertNode(
              domNode.getAttribute("username")!, 
              domNode.getAttribute("id")!, 
              domNode.getAttribute("date")!
            );
        }

        if (content !== null && content !== '' && className?.includes("editor-delete")) {
            node = $createDeleteNode(
              domNode.getAttribute("username")!, 
              domNode.getAttribute("id")!,
               domNode.getAttribute("date")!
            );
        }

    }

    return {
        node
    };
}
 

/**
 * Creates a InsertNode.
 * @returns InsertNode.
 */
export function $createInsertNode(username: string, id?: string, date?: string): InsertNode {
  return $applyNodeReplacement(new InsertNode(username, id, date));
}

/**
 * Determines if node is a InsertNode.
 * @param node - The node to be checked.
 * @returns true if node is a InsertNode, false otherwise.
 */
export function $isInsertNode(node: Node) {
  return node instanceof InsertNode;
}
