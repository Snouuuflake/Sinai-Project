import { createContext, useState, useLayoutEffect, useRef } from "react";

export const GlobalContext = createContext<GlobalContextType | null>(null);
const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const MAX_LIVE_ELEMENTS = 4;
  // --- live element ---------------------------------------------------------
  //const makeLiveElementsState = (): LiveElementsState => {
  const [liveElementsValue, setLiveElements] = useState<LiveElementType[]>(
    Array.from({ length: MAX_LIVE_ELEMENTS }, (_) => ({
      type: "none",
      value: "",
      reference: { object: null },
    })),
  );

  /** sets liveElements according to each new element's given index */
  const superSetLiveElements = (newLiveElements: IndexedLiveElement[]) => {
    const newValue: LiveElementType[] = [...liveElementsValue];
    newLiveElements.forEach((item) => {
      newValue[item.index] = item.liveElement;
    });
    setLiveElements(newValue);
  };

  /** sets and sends new elements */
  const sendLiveElements = (newLiveElements: IndexedLiveElement[]) => {
    newLiveElements.forEach((item) => {
      window.electron.sendSetLiveElement(item.index, item.liveElement);
    });
    superSetLiveElements(newLiveElements);
  };

  /** maps and sets liveElements to callback
   *  !! does not send !!
   */
  const mapLiveElements = (
    callback: (item: LiveElementType, i?: number) => LiveElementType,
  ) => {
    superSetLiveElements(
      liveElementsValue.map((le, i) => ({
        index: i,
        liveElement: callback(le, i),
      })),
    );
  };

  const liveElements: LiveElementsState = {
    value: liveElementsValue,
    set: superSetLiveElements,
    send: sendLiveElements,
    map: mapLiveElements,
  };
  //};

  const [openV, openS] = useState<OpenElementType[]>([]);
  const [viewV, viewS] = useState<OpenElementType>({
    type: "none",
  });
  const [bcV, bcS] = useState<"main" | "display">("main");

  const openElements = { value: openV, set: openS };
  const viewElement = { value: viewV, set: viewS };
  const bodyContent = { value: bcV, set: bcS };

  const [configC, configS] = useState<FullDisplayConfigType | null>(null);
  const displayConfig = { value: configC, set: configS };

  const [logo, setLogo] = useState<boolean>(false);
  function superSetLogo(v: boolean) {
    setLogo(v);
    window.electron.sendSetLogo(v);
  }
  const logoState = { value: logo, set: superSetLogo };

  useLayoutEffect(() => {
    window.electron
      .invokeReadDisplaySetting({})
      .then((data: FullDisplayConfigType) => {
        console.log(data);
        displayConfig.set(data);
      });
  }, []);

  const canType = useRef(false);

  return (
    <GlobalContext.Provider
      value={{
        MAX_LIVE_ELEMENTS,
        liveElements,
        openElements,
        viewElement,
        logoState,
        bodyContent,
        displayConfig,
        canType
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContextProvider;
