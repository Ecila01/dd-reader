#!/usr/bin/env python3
"""
DD Reader - 缓存清除工具

运行此脚本可以清除所有缓存数据，包括：
  - 会话恢复数据（session.json）
  - 旧版 %APPDATA% 缓存

用法：
  python clear_cache.py
  python clear_cache.py --force   (跳过确认直接清除)

当 DD Reader 出现以下问题时使用：
  - 启动后立即卡死
  - 恢复的会话导致崩溃
  - 设置异常导致界面不可用
"""

import os
import sys
import shutil
import platform

def get_data_dirs():
    """获取所有可能的缓存目录"""
    dirs = []

    # 新版：exe 同级 .data 文件夹
    exe_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
    # 如果脚本放在项目根目录，检测同级 .data
    data_dir = os.path.join(exe_dir, ".data")
    if os.path.isdir(data_dir):
        dirs.append(data_dir)

    # 发布版 exe 目录下的 .data
    if os.path.basename(exe_dir).lower() == "release":
        parent = os.path.dirname(exe_dir)
        for candidate in [os.path.join(parent, ".data")]:
            if os.path.isdir(candidate):
                dirs.append(candidate)

    # 旧版：%APPDATA%/com.ddreader.app
    if platform.system() == "Windows":
        appdata = os.environ.get("APPDATA", "")
        old = os.path.join(appdata, "com.ddreader.app")
        if os.path.isdir(old):
            dirs.append(old)

    return dirs

def main():
    data_dirs = get_data_dirs()

    print("=" * 50)
    print("  DD Reader - 缓存清除工具")
    print("=" * 50)
    print()

    if not data_dirs:
        print("[OK] 未找到任何缓存目录，无需清除。")
        print("    (缓存位于 exe 同级的 .data 文件夹中)")
        print()
        input("按 Enter 退出...")
        return

    print(f"  找到 {len(data_dirs)} 个缓存目录:")
    print()
    for d in data_dirs:
        print(f"    {d}")
    print()

    # 列出所有文件
    all_files = []
    total_size = 0
    for d in data_dirs:
        for root, dirs, filenames in os.walk(d):
            for f in filenames:
                fp = os.path.join(root, f)
                try:
                    sz = os.path.getsize(fp)
                    total_size += sz
                    all_files.append((fp, sz))
                except OSError:
                    pass

    if not all_files:
        print("[OK] 缓存目录为空，无需清除。")
        print()
        input("按 Enter 退出...")
        return

    print(f"  将清除 {len(all_files)} 个文件 ({total_size/1024:.1f} KB)")
    print()

    force = "--force" in sys.argv or "-f" in sys.argv
    if not force:
        confirm = input("确认清除? (y/n): ").strip().lower()
        if confirm != 'y':
            print("已取消。")
            print()
            input("按 Enter 退出...")
            return

    print()
    for d in data_dirs:
        try:
            shutil.rmtree(d)
            print(f"[OK] 已清除: {d}")
        except Exception as e:
            print(f"[ERROR] 清除失败: {d} — {e}")
            print("    请手动删除上述目录。")

    print()
    print("[OK] 缓存清除完成！")
    print("    下次启动 DD Reader 将以全新状态启动。")
    print()
    input("按 Enter 退出...")

if __name__ == "__main__":
    main()