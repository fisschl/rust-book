---
title: 21.1. 构建一个单线程 Web 服务器
---

我们将从让单线程 Web 服务器工作开始。在我们开始之前，让我们快速了解一下构建 Web 服务器所涉及的协议。这些协议的细节超出了本书的范围，但简要概述将为你提供所需的信息。

Web 服务器涉及的两个主要协议是 _超文本传输协议_（*HTTP*）和 _传输控制协议_（*TCP*）。这两种协议都是 _请求-响应_ 协议，这意味着 _客户端_ 发起请求，_服务器_ 监听请求并向客户端提供响应。这些请求和响应的内容由协议定义。

TCP 是较低级别的协议，描述了信息如何从一台服务器传输到另一台服务器的细节，但不指定该信息是什么。HTTP 在 TCP 之上构建，通过定义请求和响应的内容。从技术上讲，可以将 HTTP 与其他协议一起使用，但在绝大多数情况下，HTTP 通过 TCP 发送其数据。我们将使用 TCP 和 HTTP 请求和响应的原始字节。

## 监听 TCP 连接

我们的 Web 服务器需要监听 TCP 连接，因此这是我们要做的第一部分。标准库提供了一个 `std::net` 模块，让我们可以做到这一点。让我们按照通常的方式创建一个新项目：

```console
$ cargo new hello
     Created binary (application) `hello` project
$ cd hello
```

现在在 *src/main.rs* 中输入清单 21-1 中的代码以开始。这段代码将在本地地址 `127.0.0.1:7878` 监听传入的 TCP 流。当它接收到传入流时，它将打印 `Connection established!`。

**清单 21-1**：监听传入流并在接收到流时打印消息

```rust
use std::net::TcpListener;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        println!("Connection established!");
    }
}
```

使用 `TcpListener`，我们可以在地址 `127.0.0.1:7878` 监听 TCP 连接。在地址中，冒号前的部分是代表你计算机的 IP 地址（这在每台计算机上都相同，并不代表作者的计算机），`7878` 是端口。我们选择这个端口有两个原因：HTTP 通常不接受在这个端口上，因此我们的服务器不太可能与你机器上可能运行的任何其他 Web 服务器冲突；而且 7878 是在电话上输入 *rust*。

在这种情况下，`bind` 函数的工作方式类似于 `new` 函数，因为它将返回一个新的 `TcpListener` 实例。该函数被称为 `bind`，因为在网络中，连接到端口进行监听被称为"绑定到端口"。

`bind` 函数返回一个 `Result<T, E>`，这表明绑定可能会失败，例如，如果我们运行了两个程序实例，因此有两个程序监听同一个端口。因为我们正在编写一个仅用于学习目的的基本服务器，我们不会担心处理这些类型的错误；相反，我们使用 `unwrap` 在发生错误时停止程序。

`TcpListener` 上的 `incoming` 方法返回一个迭代器，为我们提供一系列流（更具体地说，类型为 `TcpStream` 的流）。单个 _流_ 代表客户端和服务器之间的开放连接。_连接_ 是客户端连接到服务器、服务器生成响应以及服务器关闭连接的完整请求和响应过程的名称。因此，我们将从 `TcpStream` 读取以查看客户端发送了什么，然后将我们的响应写入流以将数据发送回客户端。总的来说，这个 `for` 循环将依次处理每个连接，并为我们生成一系列流来处理。

目前，我们对流的处理包括调用 `unwrap` 以在流有任何错误时终止我们的程序；如果没有错误，程序会打印一条消息。我们将在下一个清单中为成功情况添加更多功能。当客户端连接到服务器时，我们可能会从 `incoming` 方法收到错误，原因是我们实际上并没有遍历连接。相反，我们正在遍历 _连接尝试_。连接可能由于多种原因而不成功，其中许多是操作系统特定的。例如，许多操作系统对它们可以同时支持的开放连接数量有限制；超过该数量的新连接尝试将产生错误，直到一些开放连接被关闭。

让我们尝试运行这段代码！在终端中调用 `cargo run`，然后在 Web 浏览器中加载 *127.0.0.1:7878*。浏览器应该显示"Connection reset"之类的错误消息，因为服务器目前没有发送回任何数据。但是当你查看终端时，你应该会看到浏览器连接到服务器时打印的几条消息！

```text
     Running `target/debug/hello`
Connection established!
Connection established!
Connection established!
```

有时你会看到一个浏览器请求打印多条消息；原因可能是浏览器正在请求页面以及请求其他资源，比如浏览器标签中显示的 *favicon.ico* 图标。

也可能是因为浏览器尝试多次连接到服务器，因为服务器没有响应任何数据。当 `stream` 在循环结束时超出作用域并被丢弃时，连接作为 `drop` 实现的一部分被关闭。浏览器有时会通过重试来处理关闭的连接，因为问题可能是暂时的。

浏览器有时也会打开多个连接到服务器而不发送任何请求，以便如果它们稍后发送请求，这些请求可以更快地发生。当这种情况发生时，我们的服务器将看到每个连接，无论该连接上是否有任何请求。例如，许多基于 Chrome 的浏览器版本会这样做；你可以通过使用隐私浏览模式或使用不同的浏览器来禁用该优化。

重要因素是我们已经成功获得了 TCP 连接的句柄！

记得在完成运行特定版本的代码后，通过按 `ctrl-c` 停止程序。然后，在你进行每组代码更改后，通过调用 `cargo run` 命令重新启动程序，以确保你正在运行最新的代码。

## 读取请求

让我们实现从浏览器读取请求的功能！为了分离首先获取连接然后对连接采取某些操作的考虑，我们将启动一个新函数来处理连接。在这个新的 `handle_connection` 函数中，我们将从 TCP 流读取数据并打印它，以便我们可以看到从浏览器发送的数据。将代码更改为清单 21-2 所示的样子。

**清单 21-2**：从 `TcpStream` 读取并打印数据

```rust
use std::{
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let http_request: Vec<_> = buf_reader
        .lines()
        .map(|result| result.unwrap())
        .take_while(|line| !line.is_empty())
        .collect();

    println!("Request: {http_request:#?}");
}
```

我们将 `std::io::BufReader` 和 `std::io::prelude` 引入作用域，以获得允许我们从流读取和写入流的 trait 和类型。在 `main` 函数的 `for` 循环中，我们现在不再打印说我们已建立连接的消息，而是调用新的 `handle_connection` 函数并将 `stream` 传递给它。

在 `handle_connection` 函数中，我们创建了一个新的 `BufReader` 实例，它包装了对 `stream` 的引用。`BufReader` 通过为我们管理对 `std::io::Read` trait 方法的调用来添加缓冲。

我们创建一个名为 `http_request` 的变量来收集浏览器发送给我们服务器的请求行。我们通过添加 `Vec<_>` 类型注解来表明我们希望将这些行收集到一个向量中。

`BufReader` 实现了 `std::io::BufRead` trait，它提供了 `lines` 方法。`lines` 方法通过在每次看到换行字节时拆分数据流来返回 `Result<String, std::io::Error>` 的迭代器。为了获得每个 `String`，我们对每个 `Result` 进行 `map` 和 `unwrap`。如果数据不是有效的 UTF-8 或者从流中读取有问题，`Result` 可能是一个错误。同样，生产程序应该更优雅地处理这些错误，但我们为了简单起见选择在错误情况下停止程序。

浏览器通过连续发送两个换行字符来发出 HTTP 请求结束的信号，所以为了从流中获取一个请求，我们取行直到我们得到一个空字符串。一旦我们将行收集到向量中，我们就使用漂亮的调试格式打印它们，以便我们可以查看 Web 浏览器发送给我们服务器的指令。

让我们试试这段代码！启动程序并在 Web 浏览器中再次发出请求。请注意，我们仍然会在浏览器中收到错误页面，但我们程序的终端输出现在看起来类似这样：

```console
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.42s
     Running `target/debug/hello`
Request: [
    "GET / HTTP/1.1",
    "Host: 127.0.0.1:7878",
    "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:99.0) Gecko/20100101 Firefox/99.0",
    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language: en-US,en;q=0.5",
    "Accept-Encoding: gzip, deflate, br",
    "DNT: 1",
    "Connection: keep-alive",
    "Upgrade-Insecure-Requests: 1",
    "Sec-Fetch-Dest: document",
    "Sec-Fetch-Mode: navigate",
    "Sec-Fetch-Site: none",
    "Sec-Fetch-User: ?1",
    "Cache-Control: max-age=0",
]
```

根据你的浏览器，你可能会得到稍微不同的输出。现在我们正在打印请求数据，我们可以通过查看请求第一行中 `GET` 后面的路径来查看为什么我们会从一个浏览器请求中得到多个连接。如果重复连接都在请求 */*，我们知道浏览器正在尝试重复获取 */*，因为它没有从我们的程序得到响应。

让我们分解这个请求数据，以了解浏览器在向我们的程序请求什么。

## 更仔细地查看 HTTP 请求

HTTP 是一种基于文本的协议，请求采用以下格式：

```text
Method Request-URI HTTP-Version CRLF
headers CRLF
message-body
```

第一行是 _请求行_，其中包含有关客户端正在请求的信息。请求行的第一部分指示正在使用的方法，例如 `GET` 或 `POST`，它描述了客户端如何发出此请求。我们的客户端使用了 `GET` 请求，这意味着它正在请求信息。

请求行的下一部分是 */*，它指示客户端正在请求的 _统一资源标识符_（*URI*）：URI 几乎与 _统一资源定位符_（*URL*）相同，但不完全相同。URI 和 URL 之间的区别对于我们在本章中的目的并不重要，但 HTTP 规范使用术语 _URI_，因此我们可以在这里 mentally 用 _URL_ 代替 _URI_。

最后一部分是客户端使用的 HTTP 版本，然后请求行以 CRLF 序列结束。（*CRLF* 代表 _回车_ 和 _换行_，这些是来自打字机时代的术语！）CRLF 序列也可以写为 `\r\n`，其中 `\r` 是回车，`\n` 是换行。*CRLF 序列_ 将请求行与请求的其余数据分开。请注意，当 CRLF 被打印时，我们看到一个新行开始而不是 `\r\n`。

查看我们从运行程序到目前为止收到的请求行数据，我们看到 `GET` 是方法，*/* 是请求 URI，`HTTP/1.1` 是版本。

在请求行之后，从 `Host:` 开始的剩余行是头部。`GET` 请求没有正文。

尝试从不同的浏览器发出请求或请求不同的地址，例如 *127.0.0.1:7878/test*，以查看请求数据如何变化。

现在我们知道浏览器在请求什么，让我们发送回一些数据！

## 编写响应

我们将实现发送数据以响应客户端请求。响应具有以下格式：

```text
HTTP-Version Status-Code Reason-Phrase CRLF
headers CRLF
message-body
```

第一行是 _状态行_，其中包含响应中使用的 HTTP 版本、总结请求结果的数字状态代码以及提供状态代码文本描述的原因短语。在 CRLF 序列之后是任何头部、另一个 CRLF 序列以及响应的正文。

这里是一个使用 HTTP 版本 1.1 且具有状态代码 200、OK 原因短语、没有头部和没有正文的响应示例：

```text
HTTP/1.1 200 OK\r\n\r\n
```

状态代码 200 是标准的成功响应。文本是一个微小的成功 HTTP 响应。让我们将其写入流作为我们对成功请求的响应！从 `handle_connection` 函数中，删除打印请求数据的 `println!` 并将其替换为清单 21-3 中的代码。

**清单 21-3**：向流写入一个微小的成功 HTTP 响应

```rust
use std::{
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let http_request: Vec<_> = buf_reader
        .lines()
        .map(|result| result.unwrap())
        .take_while(|line| !line.is_empty())
        .collect();

    let response = "HTTP/1.1 200 OK\r\n\r\n";

    stream.write_all(response.as_bytes()).unwrap();
}
```

第一行新代码定义了保存成功消息数据的 `response` 变量。然后，我们在 `response` 上调用 `as_bytes` 将字符串数据转换为字节。`stream` 上的 `write_all` 方法接受一个 `&[u8]` 并将这些字节直接发送下连接。因为 `write_all` 操作可能会失败，所以我们像以前一样对任何错误结果使用 `unwrap`。同样，在真正的应用程序中，你会在这里添加错误处理。

通过这些更改，让我们运行我们的代码并发出请求。我们不再向终端打印任何数据，因此除了 Cargo 的输出之外，我们不会看到任何输出。当你在 Web 浏览器中加载 *127.0.0.1:7878* 时，你应该得到一个空白页面而不是错误。你刚刚手工编码了接收 HTTP 请求和发送响应！

## 返回真实的 HTML

让我们实现返回不仅仅是空白页面的功能。在你的项目目录的根目录中创建新文件 *hello.html*，而不是在 *src* 目录中。你可以输入任何你想要的 HTML；清单 21-4 显示了一种可能性。

**清单 21-4**：在响应中返回的示例 HTML 文件

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello!</title>
  </head>
  <body>
    <h1>Hello!</h1>
    <p>Hi from Rust</p>
  </body>
</html>
```

这是一个包含标题和一些文本的最小 HTML5 文档。为了在收到请求时从服务器返回此内容，我们将修改 `handle_connection`，如清单 21-5 所示，以读取 HTML 文件，将其作为正文添加到响应中，并发送它。

**清单 21-5**：将 *hello.html* 的内容作为响应正文发送

```rust
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let http_request: Vec<_> = buf_reader
        .lines()
        .map(|result| result.unwrap())
        .take_while(|line| !line.is_empty())
        .collect();

    let status_line = "HTTP/1.1 200 OK";
    let contents = fs::read_to_string("hello.html").unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

我们在 `use` 语句中添加了 `fs`，以将标准库的文件系统模块引入作用域。读取文件内容到字符串的代码应该看起来很熟悉；我们在清单 12-4 中为 I/O 项目读取文件内容时使用了它。

接下来，我们使用 `format!` 将文件内容添加为成功响应的正文。为了确保有效的 HTTP 响应，我们添加了 `Content-Length` 头部，它设置为我们响应正文的大小——在这种情况下，是 *hello.html* 的大小。

用 `cargo run` 运行这段代码并在浏览器中加载 *127.0.0.1:7878*；你应该看到你的 HTML 被渲染！

目前，我们正在忽略 `http_request` 中的请求数据，只是无条件地发送回 HTML 文件的内容。这意味着如果你尝试在浏览器中请求 *127.0.0.1:7878/something-else*，你仍然会收到相同的 HTML 响应。目前，我们的服务器非常有限，不像大多数 Web 服务器那样工作。我们希望根据请求自定义我们的响应，并且只对 */* 的良好请求发送回 HTML 文件。

## 验证请求并选择性响应

现在，我们的 Web 服务器将返回文件中的 HTML，无论客户端请求什么。让我们添加功能来检查浏览器是否在返回 HTML 文件之前请求 */*，如果浏览器请求其他内容，则返回错误。为此，我们需要修改 `handle_connection`，如清单 21-6 所示。这段新代码将我们收到的请求内容与我们对 */* 请求的了解进行比较，并添加 `if` 和 `else` 块来不同地处理请求。

**清单 21-6**：对 */* 的请求与其他请求进行不同处理

```rust
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    if request_line == "GET / HTTP/1.1" {
        let status_line = "HTTP/1.1 200 OK";
        let contents = fs::read_to_string("hello.html").unwrap();
        let length = contents.len();

        let response = format!(
            "{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}"
        );

        stream.write_all(response.as_bytes()).unwrap();
    } else {
        // some other request
    }
}
```

我们只查看 HTTP 请求的第一行，因此我们不是将整个请求读入向量，而是调用 `next` 以从迭代器中获取第一个项目。第一个 `unwrap` 处理 `Option`，如果迭代器没有项目，则停止程序。第二个 `unwrap` 处理 `Result`，其效果与清单 21-2 中添加的 `map` 中的 `unwrap` 相同。

接下来，我们检查 `request_line` 以查看它是否等于对 */* 路径的 GET 请求的请求行。如果是，则 `if` 块返回我们 HTML 文件的内容。

如果 `request_line` *不* 等于对 */* 路径的 GET 请求，这意味着我们收到了其他请求。我们将在稍后向 `else` 块添加代码以响应所有其他请求。

现在运行这段代码并请求 *127.0.0.1:7878*；你应该会收到 *hello.html* 中的 HTML。如果你发出任何其他请求，例如 *127.0.0.1:7878/something-else*，你将收到一个连接错误，就像你在运行清单 21-1 和清单 21-2 中的代码时看到的那样。

现在让我们将清单 21-7 中的代码添加到 `else` 块中，以返回带有状态代码 404 的响应，该代码表示未找到请求的内容。我们还将返回一些 HTML，用于在浏览器中渲染页面，向最终用户指示响应。

**清单 21-7**：如果请求了 */* 以外的任何内容，则以状态代码 404 和错误页面进行响应

```rust
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    if request_line == "GET / HTTP/1.1" {
        let status_line = "HTTP/1.1 200 OK";
        let contents = fs::read_to_string("hello.html").unwrap();
        let length = contents.len();

        let response = format!(
            "{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}"
        );

        stream.write_all(response.as_bytes()).unwrap();
    } else {
        let status_line = "HTTP/1.1 404 NOT FOUND";
        let contents = fs::read_to_string("404.html").unwrap();
        let length = contents.len();

        let response = format!(
            "{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}"
        );

        stream.write_all(response.as_bytes()).unwrap();
    }
}
```

在这里，我们的响应有一个状态行，状态代码为 404，原因短语为 `NOT FOUND`。响应的正文将是文件 *404.html* 中的 HTML。你需要在 *hello.html* 旁边创建一个 *404.html* 文件作为错误页面；同样，你可以使用任何你想要的 HTML，或者使用清单 21-8 中的示例 HTML。

**清单 21-8**：发送回任何 404 响应的页面示例内容

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello!</title>
  </head>
  <body>
    <h1>Oops!</h1>
    <p>Sorry, I don't know what you're asking for.</p>
  </body>
</html>
```

通过这些更改，再次运行你的服务器。请求 *127.0.0.1:7878* 应该返回 *hello.html* 的内容，任何其他请求，例如 *127.0.0.1:7878/foo*，应该返回来自 *404.html* 的错误 HTML。

## 重构

目前，`if` 和 `else` 块有很多重复：它们都在读取文件并将文件内容写入流。唯一的区别是状态行和文件名。让我们通过将这些差异提取到单独的 `if` 和 `else` 行中来使代码更简洁，这些行将为状态行和文件名赋值；然后我们可以无条件地在代码中使用这些变量来读取文件和写入响应。清单 21-9 显示了替换大的 `if` 和 `else` 块后的结果代码。

**清单 21-9**：重构 `if` 和 `else` 块以仅包含两种情况之间不同的代码

```rust
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    let (status_line, filename) = if request_line == "GET / HTTP/1.1" {
        ("HTTP/1.1 200 OK", "hello.html")
    } else {
        ("HTTP/1.1 404 NOT FOUND", "404.html")
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

现在 `if` 和 `else` 块只返回元组中状态行和文件名的适当值；然后我们在 `let` 语句中使用模式通过解构将这两个值赋给 `status_line` 和 `filename`，如第 19 章所述。

以前重复的代码现在位于 `if` 和 `else` 块之外，并使用 `status_line` 和 `filename` 变量。这使得更容易看到两种情况之间的差异，而且这意味着如果我们想要更改文件读取和响应写入的工作方式，我们只有一个地方需要更新代码。清单 21-9 中代码的行为将与清单 21-7 中的相同。

太棒了！我们现在有一个简单的 Web 服务器，大约 40 行 Rust 代码，它响应一个带有内容页面的请求，并对所有其他请求响应 404。

目前，我们的服务器在单个线程中运行，意味着它一次只能服务一个请求。让我们通过模拟一些慢速请求来检查这可能是一个问题。然后，我们将修复它，使我们的服务器能够同时处理多个请求。