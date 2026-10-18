import { useState } from "react";
import { SerializedMediaIdentifier } from "../../shared/media-types";
import { useContextMenu } from "../ContextMenuContext";
import { useModal } from "../ModalContext";

import "./Setlist.css";

import SetlistItem from "./SetlistItem";
import { Ellipsis, Menu, Plus } from "lucide-react";



const Setlist: React.FC<{ setlist: SerializedMediaIdentifier[] | null }> = ({ setlist }) => {
  const { showMenu } = useContextMenu();
  const maxIdChars = setlist?.map<number>(x => x.id.toString().length).reduce((p, c) => c > p ? c : p, 0) ?? 0
  return <div className="setlist main-container">
    <div className="main-container-header">
      <h1 className="main-container-title">Multimedia</h1>
    </div>
    <div className="setlist-items-container" tabIndex={-1}>
      {setlist?.map((x, i) => <SetlistItem key={i} maxIdChars={maxIdChars} item={x} />) ?? <></>}
    </div>
  </div >
};

export default Setlist;
