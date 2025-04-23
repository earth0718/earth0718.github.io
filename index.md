---
layout: default # 或者你选择的主题提供的首页布局，比如 home
title: 我的博客首页
---

<!-- 显示头像 -->
<img src="{{ site.avatar_url }}" alt="avatar" style="width: 120px; border-radius: 50%; margin-bottom: 20px;">

# 欢迎来到我的博客！

这里是一些最新的文章：

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <span> - {{ post.date | date: "%Y-%m-%d" }}</span>
    </li>
  {% endfor %}
</ul>

<!-- 你也可以在这里添加其他你想在首页显示的内容 -->
