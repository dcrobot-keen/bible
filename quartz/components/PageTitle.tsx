import { pathToRoot, joinSegments } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug!)
  const logoPath = joinSegments(baseDir, "static/dev-keen_icon2.png")
  return (
    <div class={classNames(displayClass, "page-title-container")}>
      <a href={baseDir} class="page-title-link">
        <img src={logoPath} alt="Logo" class="page-title-logo" />
        <h2 class="page-title">
          <div>Modern</div>
          <div>Robot SW</div>
        </h2>
      </a>
    </div>
  )
}

PageTitle.css = `
.page-title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-title-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
}

.page-title-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 0.5rem;
  border-radius: 8px;
}

.page-title {
  font-size: 1.75rem;
  margin: 0;
  font-family: var(--titleFont);
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
