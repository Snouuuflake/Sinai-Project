import { GlobalContext } from "../GlobalContext";

function InlineEditor() {
  //const { inlineEditorState } = useContext(GlobalContext) as GlobalContextType;

  return (
    <div
      className="inline-editor-container"
      onClick={() => {
        //inlineEditorState.set(false);
      }}
    ></div>
  );
}

export default InlineEditor;
