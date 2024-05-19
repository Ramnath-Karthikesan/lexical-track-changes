import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { $createParagraphNode, $createTextNode, $getRoot, ParagraphNode } from "lexical";
import ExampleTheme from "./ExampleTheme";
import TrackChangesPlugin from "./plugin/TrackChangesPlugin";
import InsertNode from "./nodes/InsertNode";
import DeleteNode from "./nodes/DeleteNode";
import './App.css'


export default function Editor(){

    const initialConfig = {
        editorState: () => {
            const paragraph = $createParagraphNode();
            const text = $createTextNode('Hi there this is an example of lexical editor with track changes');
            paragraph.append(text);
            $getRoot().append(paragraph);
            $getRoot().selectEnd();
        },
        namespace: "Demo",
        nodes: [
            HeadingNode,
            QuoteNode,
            ListNode,
            ListItemNode,
            ParagraphNode,
            InsertNode,
            DeleteNode
        ],
        onError: (error: Error) => {
          throw error;
        },
        theme: ExampleTheme
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <RichTextPlugin contentEditable={<ContentEditable spellCheck="false" />}
                placeholder={null}
                ErrorBoundary={LexicalErrorBoundary}
            />
            <TrackChangesPlugin />   
    
        </LexicalComposer>
    )

}