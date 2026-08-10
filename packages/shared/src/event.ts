// 1xx
export const enum IPCControl {
  master = "104",
  new = "107",
  retain = "108",
}

// 2xx
export const enum IPCPlayer {
  end = "200",
  load = "201",
  loaded = "202",
  lyric = "203",
  lyricDelay = "204",
  lyricIndex = "205",
  pause = "206",
  play = "207",
  playing = "208",
  position = "209",
  repeat = "210",
  stop = "211",
  toggle = "212",
  volume = "213",
  next = "214",
  previous = "215",
  speed = "216",
  seek = "217",
}

// 3xx
export const enum IPCQueue {
  add = "300",
  clear = "301",
  delete = "302",
  play = "305",
  new = "306",
  shift = "307",
}
