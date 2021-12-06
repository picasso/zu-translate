#### Создать из SCSS vars файл с цветами
__with regex__
find:^\$([^:]+).+
replace:.js_$1 { color: $ $1; }

__without regex__
find:-
replace:_

__with regex__
find:\$\s+
replace:$
