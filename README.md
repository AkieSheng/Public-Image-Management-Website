# 图片管理网站 使用手册

> 项目：图片管理网站
> 技术栈：Vue 3 + Vite、Node.js + Express、Sequelize、MySQL 8、Nginx、Docker Compose
> 适用：Windows / macOS / Linux（推荐 Docker Desktop + Compose）

## 【注意】仅供参考与用户使用，如有抄袭，后果自负！

## 1. 项目概览

本网站实现“图片上传—自动解析 EXIF—生成缩略图—标签管理—条件检索—轮播展示—编辑—删除”的完整闭环，并提供增强能力：AI 自动打标（Ollama + llama3.2-vision/moondream）与 MCP 对话检索接口。

系统以 Docker Compose 方式一键启动，包含：
前端（Nginx 静态站点 + 反代 /api、/uploads）、后端（Express API + 静态 uploads）、数据库（MySQL 8）、AI 打标服务（tagger）、本地模型服务（ollama）。

## 2. 启动前准备

### 2.1 软件要求

- Docker Desktop（或 Linux Docker Engine）与 Docker Compose（`docker compose` 命令可用）
- 浏览器（PC 或手机浏览器）
- 提示：如果想让 AI 打标更稳定，建议为 Docker/WSL2 分配更高内存（llama3.2-vision 需要至少 12GB）。如果只需要使用基础功能，可忽略。

### 2.2 端口与目录

默认端口：

- 前端：`http://localhost:80`
- 后端：`http://localhost:5000`
- 数据库：`localhost:3307`（容器内为 3306）
- Ollama：`http://localhost:11434`
- tagger：容器内服务 `http://tagger:8080`

数据持久化：

- `./backend/uploads`：原图与缩略图
- `db_data`：MySQL 数据卷
- `ollama_data`：Ollama 模型卷

## 3. 启动（Docker Compose）

在包含 `docker-compose.yml`的项目根目录执行：
```bash
docker compose up -d --build
```
查看容器状态：
```bash
docker compose ps
```
查看日志：
```bash
docker compose logs -f --tail=200 backend
docker compose logs -f --tail=200 tagger
docker compose logs -f --tail=200 ollama
```
停止与清理：
```bash
docker compose down
```
停止但保留网络与卷：
```bash
docker compose stop
```

## 4. Web 使用说明

### 4.1 注册与登录

1) 打开 `http://localhost` 进入登录页。
2) 未注册用户点击“注册”，填写用户名、邮箱、密码。系统会校验：密码长度≥6、邮箱格式合法，并保证用户名与邮箱在系统内唯一
3) 注册成功后使用邮箱+密码登录。
4) 若登录失效或切换账号，退出后重新登录即可。

### 4.2 上传图片

进入“上传”页面，选择图片文件上传。上传时填写标题，初始标签可选填。

上传后系统：

- 将原图保存到 `backend/uploads/originals`
- 生成缩略图保存到 `backend/uploads/thumbs`
- 解析 EXIF
- 读取分辨率并入库
- 返回图片记录，可在“图库”中查看

若上传失败，通常是文件过大或网络中断，可从后端日志定位原因。

### 4.3 图库浏览与轮播展示

登录后进入“图库”：

- 默认展示当前用户的全部图片
- 可通过检索条件过滤（关键字/日期/标签/分辨率等，以页面表单为准）
- 在检索结果基础上可进入“轮播”页面，按间隔自动播放，可播放/暂停

注：轮播展示以当前的检索结果列表为数据源。

### 4.4 图片详情、标签与元信息

进入单张图片详情页可查看：

- 标题（可编辑保存）
- EXIF 时间与地点（前提是图片自身携带 EXIF/GPS）
- 分辨率与文件信息
- 当前标签列表

标签管理支持两种写入方式：

- 覆盖保存：用新的标签集合替换当前标签
- 追加保存：在现有标签基础上追加新标签，不覆盖原有标签

### 4.5 简单编辑：裁剪与色调

在详情页左侧图片区域拖拽框选裁剪区域；右侧滑杆可调：

- 亮度
- 饱和度
- 对比度

点击“应用编辑”后：

- 后端对原图执行裁剪与色调调整并覆盖保存
- 重新生成缩略图
- 刷新页面后可看到更新后的效果

注：若裁剪越界，会返回 400 并在页面提示错误。

### 4.6 删除图片

在详情页点击“删除”并确认后，系统：

- 删除原图与缩略图文件
- 删除数据库记录及关联标签关系

注：删除不可逆。

### 4.7 移动端适配

网站采用响应式布局，手机浏览器在同一局域网下访问 `http://<电脑IP>`即可使用。

注：窄屏下按钮与输入组件会自动换行，图片可以自适应视口大小。

## 5. 增强功能使用说明

### 5.1 AI 自动打标

详情页点击“AI 打标”后，后端会调用 `tagger` 服务，由 `tagger` 向 `ollama` 发送带图片的多模态请求生成标签，随后将标签写入数据库并显示在页面中。

注：由于本地推理速度与机器性能相关，AI 打标可能需要几十秒到数分钟。如果发生超时或内存不够用，后端会回退为启发式标签（如“高分辨率”）。

### 5.2 MCP 对话检索接口

系统提供 `POST /api/mcp/query` 接口，用于以“对话”方式检索图片。

接口会根据 prompt 解析检索条件并返回图片列表。

## 6. 根据实际需要修改 docker-compose.yml

本项目的 `docker-compose.yml` 里，对外端口、数据库账号与库名、数据持久化目录、AI 模型选择与超时、以及容器之间互相访问的地址都是可修改的。

下面按最常见需求给出修改方法。

### 6.1 修改对外端口

如果你的机器上已经有其它服务占用了 80/5000/11434/3307，可以修改每个服务的 `ports` 左侧端口（宿主机端口）。容器内端口不动。

不过注意改完后，浏览器访问地址也改变了，请根据你修改的地址按需访问。

### 6.2 修改数据库账号/密码/库名

你的 compose 里 MySQL 的账号密码写在 `db.environment`，后端连接参数写在 `backend.environment`。这两块必须一致，否则后端会连不上数据库。

如你希望 root 密码改为 `123456`，库名改为 `photo_db`：

```yaml
db:
  environment:
    MYSQL_ROOT_PASSWORD: 123456
    MYSQL_DATABASE: photo_db

backend:
  environment:
    DB_USER: root
    DB_PASS: 123456
    DB_NAME: photo_db
```

### 6.3 修改数据持久化目录

现在项目把图片目录挂载在：

```yaml
backend:
  volumes:
    - ./backend/uploads:/app/uploads
```

如果你希望把图片保存到另一个位置，可以修改成绝对路径。

另外 Ollama 模型默认放在 `ollama_data` 卷里：

```yaml
ollama:
  volumes:
    - ollama_data:/root/.ollama
```

如果你希望模型保存到其他目录，也可以改成路径挂载：

```yaml
ollama:
  volumes:
    - ./ollama_models:/root/.ollama
```

### 6.4 选择更大的模型

你可以把 tagger 的模型从 `moondream` 换成 `llama3.2-vision`：

```yaml
tagger:
  environment:
    OLLAMA_MODEL: llama3.2-vision
```

如果要换其它模型，只需要改这里的 `OLLAMA_MODEL`，然后用 Ollama 拉取该模型即可。

改完模型后，需要重启并在 ollama 容器里再拉取一次：

```bash
docker compose up -d --build
docker compose exec ollama ollama pull moondream
```

> 注意！改变模型虽然可能增加模型识别的准确度和标签的可靠性，但是系统稳定性可能会下降，请酌情修改

### 6.5 调整 AI 超时与重试

本项目的 AI 链路涉及三段超时：

* 后端调用 tagger：`AI_TAGGER_TIMEOUT`
* tagger 调用 ollama：`OLLAMA_TIMEOUT`
* tagger 下载图片：`FETCH_IMG_TIMEOUT`

如果你机器性能弱，推理容易超时，可以把这些时间加大；当然也可以酌情调小调小。

如你希望整体最多等 2 分钟，可以修改：

```yaml
backend:
  environment:
    AI_TAGGER_TIMEOUT: 120000

tagger:
  environment:
    OLLAMA_TIMEOUT: 120000
    FETCH_IMG_TIMEOUT: 15000
```

## 7. 常见问题

若出现 “镜像拉取失败 / 403 / unexpected EOF”，可先单独 `docker pull` 对应镜像并重试 `docker compose up --build`。

### 如何在其他设备（如手机）上访问这个网站
在终端中使用 `ipconfig` 命令查询本机 WLAN
例如作者机器 WLAN 为 10.162.34.24
则非 PC 端可以在连接同一局域网后访问 http://10.162.34.24/ 即可访问此网站