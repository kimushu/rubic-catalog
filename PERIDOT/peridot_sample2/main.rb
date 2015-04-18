#!mruby
# D22～D27について、抵抗を通してLEDのカソードを接続しておいてください。
# LEDのアノードは、まとめて3.3Vまたは5Vに接続してください。

# LEDの接続されたビットのみを取り出す
# (必須ではありませんが、コードが読みやすくなると同時に、動作も速くなります)
led = Peridot.digital_io[27..22]

# LEDは全ビット出力に設定。カソードをD22～D27に繋いでいるので、負論理とする。
# (設定系のメソッドはselfを返すので、下記のようなメソッドチェーンで記述できます)
led.enable_output.active_low

loop {
    led.width.times {|n|
        # n番目のLEDをON/OFFする
        led[n].toggle

        # 100ミリ秒待機する
        msleep 100
    }
}