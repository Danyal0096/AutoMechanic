-- Preserve semantic LTR islands in both HTML and XePersian output.
local function has_class(classes, wanted)
  for _, class_name in ipairs(classes) do
    if class_name == wanted then
      return true
    end
  end
  return false
end

local function inlines_to_latex(inlines)
  local document = pandoc.Pandoc({ pandoc.Plain(inlines) })
  local rendered = pandoc.write(document, "latex")
  rendered = rendered:gsub("%s+$", "")
  rendered = rendered:gsub("\n", " ")
  return rendered
end

function Span(element)
  if not has_class(element.classes, "ltr") then
    return element
  end

  if FORMAT:match("latex") then
    return pandoc.RawInline("latex", "\\lr{" .. inlines_to_latex(element.content) .. "}")
  end

  if FORMAT:match("html") then
    element.attributes.dir = "ltr"
    element.attributes.lang = element.attributes.lang or "en"
  end

  return element
end

function Link(element)
  if FORMAT:match("latex") then
    local anchor = element.target:match("^references%.qmd(#source%-.+)$")
    if anchor then
      element.target = anchor
    end
  end
  return element
end

function Div(element)
  if FORMAT:match("latex") and has_class(element.classes, "glossary-compact") then
    return {
      pandoc.RawBlock("latex", "\\begin{multicols}{2}\\raggedcolumns"),
      element,
      pandoc.RawBlock("latex", "\\end{multicols}"),
    }
  end
  return element
end

function Meta(metadata)
  -- XePersian owns Persian language and calendar support in the PDF path.
  -- Removing Pandoc's `lang` only for LaTeX prevents a second Persian Babel
  -- layer (and the duplicate \persiantoday command) while HTML keeps lang=fa.
  if FORMAT:match("latex") then
    metadata.lang = nil
  end
  return metadata
end
