- [ ] Remove state (logo and liveelements from node)
    - [!] this may be an awful idea
    - Add useEffect event listeners in main window to respond with state
    - Requests for getLogo and getLiveElement have to be handled via promises to be private
- [ ] make VerseButton exist in a context because that many props is bad for health
- [ ] re-do display settings
    - [ ] add classes
    - [ ] fix margins
- [ ] show null not default when null in individual display settings
- [ ] fix selected (make open-element-specific) (stop reset when leaving displaysettings)
- [ ] re-do button indexes when deleting verse (some pointer garbage)
- [ ] fix indexes, completely revamp system so that it automatically changes index when anything gets moved
    - maybe it can be some more abstract object so that liveElement doesnt use buttonID but some pointer
    - [ ] disallow moving when not convenient


