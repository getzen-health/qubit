# Page snapshot

```yaml
- main [ref=e2]:
  - generic [ref=e3]:
    - link "SWE Graph" [ref=e4] [cursor=pointer]:
      - /url: /
    - navigation "Primary navigation" [ref=e5]:
      - link "Return home" [ref=e6] [cursor=pointer]:
        - /url: /
  - generic [ref=e7]:
    - generic [ref=e8]: "404"
    - heading "Page not found" [level=1] [ref=e9]
    - paragraph [ref=e10]: The requested page is not part of the current frontend foundation.
    - link "Go to homepage" [ref=e12] [cursor=pointer]:
      - /url: /
  - generic [ref=e13]:
    - heading "Available routes" [level=2] [ref=e15]
    - list [ref=e16]:
      - listitem [ref=e17]: /
      - listitem [ref=e18]: /courses
      - listitem [ref=e19]: /courses/:courseSlug
      - listitem [ref=e20]: /courses/:courseSlug/chapters/:chapterSlug/lessons/:lessonSlug
      - listitem [ref=e21]: /compiler
      - listitem [ref=e22]: /interviews
      - listitem [ref=e23]: /whiteboard
      - listitem [ref=e24]: /whiteboard/boards/:boardId
      - listitem [ref=e25]: /whiteboard/shared/:shareId
      - listitem [ref=e26]: /profile
      - listitem [ref=e27]: /login
      - listitem [ref=e28]: /logout
  - generic [ref=e29]: Built for deliberate, end-to-end SWE interview preparation.
```