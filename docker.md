# 重新构建并启动
docker compose down -v
docker compose build
docker compose up -d

# 查看状态与健康检查
docker compose ps
docker logs -f project-backend

# 运行整体流程
docker compose up --build

# 如何在其他设备（如手机）上访问这个网站
在终端中使用 `ipconfig` 命令查询本机 WLAN
例如作者机器 WLAN 为 10.162.34.24
则非 PC 端可以在连接同一局域网后访问 http://10.162.34.24/