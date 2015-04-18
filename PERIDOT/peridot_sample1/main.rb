#!mruby
loop {
    # START LEDのON/OFFを切り替える
    # なお、出力専用ピンのためenable_outputを呼び出す必要はありません
    Peridot.start_led.toggle
    
    # 500ミリ秒待機する
    msleep 500
}